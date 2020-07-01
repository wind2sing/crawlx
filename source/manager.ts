import Debug from "debug";
import EventEmitter from "eventemitter3";
import { Crawler } from "./crawler";
import { BaseQueue, cmpFunction, PriorityQueueArray } from "./priority-queue";
import { getGotOptionsFromTask, taskCmp } from "./task";
import { Task, TaskMeta } from "./index";
import { genId } from "./utils";
import AsyncLock from "async-lock";

export interface ManagerOptions {
  autoStart?: boolean;
  queueClass?: new () => BaseQueue<Task>;
  cmp?: cmpFunction<Task>;
  crawler?: Crawler;
}

export const defaultManagerOptions: ManagerOptions = {
  autoStart: true,
  queueClass: PriorityQueueArray,
  cmp: taskCmp,
};

const emptyFuntion = () => { };
const debug = Debug("crawlx");

function isSpawnerMatch(spawner, url: string, meta: TaskMeta): boolean {
  if (spawner.regex && spawner.regex.test(url)) return true;
  if (spawner.validator && spawner.validator(url, meta)) return true;
}
function spawnTaskWithUrlMeta(url: string, meta: TaskMeta, spawners): Task {
  for (const spawner of spawners) {
    if (isSpawnerMatch(spawner, url, meta)) {
      return {
        url,
        spawned: true,
        meta,
        ...spawner.spawn(url, meta),
      } as Task;
    }
  }
}
function normalizeTaskInWorker(task: Task, spawners): Task {
  // used in worker function to truly spawn a task
  if (task.spawned) {
    let spawnedTask = spawnTaskWithUrlMeta(task.url, task.meta, spawners);
    return spawnedTask ? { ...task, ...spawnedTask } : null;
  } else return task;
}
function normalizeTaskWhenAdded(task: Task | string, meta?: TaskMeta): Task {
  // used in add function to convert a string task to a normal task
  if (!task) return null;
  let newTask: Task = null;
  if (typeof task === "string")
    newTask = { url: task, spawned: true, meta: { ...meta } };
  else if (typeof task === "object")
    newTask = { ...task, meta: { ...task.meta, ...meta } };
  else return null;
  if (!newTask.meta.id) newTask.meta.id = genId();
  return newTask;
}
export default class Manager extends EventEmitter {
  options: ManagerOptions;
  crawler: Crawler;
  private _queueClass: new () => BaseQueue<Task>;
  private _queue: BaseQueue<Task>;
  private _pendingCount: number;
  private _isPaused: boolean;
  private _resolveEmpty: Function;
  private _resolveIdle: Function;
  private _lock: any;
  private _resolveMap: Map<
    string,
    [(value?: any) => void, (reason?: any) => void, Promise<Task>?]
  >;

  constructor(opts: ManagerOptions, crawler: Crawler) {
    super();
    this.options = { ...defaultManagerOptions, ...opts };
    this.crawler = crawler;

    this._lock = new AsyncLock({ maxPending: Infinity });
    this._queueClass = this.options.queueClass;
    this._queue = new this._queueClass();
    this._isPaused = this.options.autoStart === false;
    this._resolveMap = new Map();
    this._pendingCount = 0;

    this._resolveEmpty = emptyFuntion;
    this._resolveIdle = emptyFuntion;
  }

  get concurrency() {
    return this.crawler.options.concurrency;
  }

  async getSize() {
    return await this._queue.getSize();
  }
  get pending() {
    return this._pendingCount;
  }
  pause() {
    this._isPaused = true;
  }
  get isPaused() {
    return this._isPaused;
  }
  async start() {
    if (!this._isPaused) {
      return this;
    }

    this._isPaused = false;
    await this._processQueue();
    return this;
  }
  async _processQueue() {
    while (await this._tryToStartAnother()) { }
  }
  async _next() {
    if ((await this._queue.getSize()) === 0) {
      this.emit("empty");
      this._resolveEmpty();
      this._resolveEmpty = emptyFuntion;
      if (this._pendingCount === 0) {
        this.emit("idle");
        this._resolveIdle();
        this._resolveIdle = emptyFuntion;
      }
    }
    await this._tryToStartAnother();
  }
  async _startOk() {
    if (this._isPaused) return false;
    if (this._pendingCount >= this.concurrency) return false;
    let task = await this._queue.dequeue();
    if (!task) return false;
    else {
      this._pendingCount++;
      this.emit("active");
      return task;
    }
  }
  async _tryToStartAnother() {
    let task = await this._lock.acquire("crawlx", this._startOk.bind(this));
    if (!task) return false;
    try {
      await this.worker(task);
    } catch (error) {
      this.reject(error, task);
    }
    this._pendingCount--;
    await this._next();
    return true;
  }

  private _resolveTaskPromise(error: Error, task: Task) {
    let meths = this._resolveMap.get(task.meta.id);
    if (error) meths[1](error);
    else meths[0](task);
    this._resolveMap.delete(task.meta.id);
  }
  resolve(task: Task) {
    this._resolveTaskPromise(null, task);
  }
  reject(error: any, task: Task) {
    this._resolveTaskPromise(error, task);
  }

  private async _executeTask(task: Task) {
    // only return error if it occurs
    try {
      let r = await this.crawler.agent(task.url, getGotOptionsFromTask(task));
      debug(`${r.request.options.method} ${r.url} -> ${r.statusCode}`);
      task.res = r;
    } catch (err) {
      task.err = err;
      // catch response from error for detailed information
      if (err.response) {
        task.res = err.response;
        debug(
          `${task.res.request.options.method} ${task.res.url} -> ${task.res.statusCode}`
        );
      }
      this.crawler.handleTaskError(task, err);
      return err;
    }
  }

  async worker(t: Task): Promise<Task> {
    // spawner mode
    let task: Task = normalizeTaskInWorker(t, this.crawler.spawners);
    if (!task) {
      // spawner unable to spawn a task
      this.resolve(t);
      return t;
    }

    //plugin before
    await this.crawler.handleTask(task, "before");

    // main work
    if (!task.cancel && (await this._executeTask(task))) {
      // continue execution for not-cancelled task
      // then return task immediately without resolving if an error occurs
      return task;
    }

    // plugin after
    await this.crawler.handleTask(task, "after");

    // callback
    if (task.callback && !task.cancel) await task.callback(task, this.crawler);
    this.resolve(task);
    return task;
  }

  private _onAction(actionName: string) {
    return new Promise((resolve) => {
      const existingResolve = this[actionName];
      this[actionName] = () => {
        existingResolve();
        resolve();
      };
    });
  }
  async onEmpty() {
    return this._onAction("_resolveEmpty");
  }
  async onIdle() {
    return this._onAction("_resolveIdle");
  }

  async add(task: Task | string, meta: TaskMeta = {}): Promise<Task> {
    let newTask: Task = normalizeTaskWhenAdded(task, meta);
    if (!newTask) {
      await this._tryToStartAnother();
      return Promise.resolve({ url: "" });
    }
    let promise: Promise<Task>;
    // add promise and revole-reject funcs to the resolveMap
    if (this._resolveMap.has(newTask.meta.id)) {
      promise = this._resolveMap.get(newTask.meta.id)[2];
    } else {
      promise = new Promise((resolve, reject) =>
        this._resolveMap.set(newTask.meta.id, [resolve, reject])
      );
      this._resolveMap.get(newTask.meta.id).push(promise);
    }
    await this._queue.enqueue(newTask);
    await this._tryToStartAnother();
    return promise;
  }
}
