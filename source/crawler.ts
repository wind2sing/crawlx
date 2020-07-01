import { TaskMeta, Task, Spawner, CrawlerOptions } from "./index";
import { Plugin, PluginMap, PluginActionMap, cmpPlugin } from "./plugin";
import agent, { Agent } from "./agent";

import Manager from "./manager";
import * as plugins from "./plugins";

export class Crawler {
  spawners: Array<Spawner>;
  store: object;
  manager: Manager;
  agent: Agent;
  options: CrawlerOptions;

  plugins: PluginMap;
  _plugins: PluginActionMap;

  constructor(options: CrawlerOptions) {
    this.store = {};
    this.options = options;

    this.spawners = [];
    this._initAgent();
    this._initPlugins();
    this._initManager();
  }
  get agentOptions() {
    return this.agent.defaults.options;
  }
  private _initAgent() {
    this.agent = agent(this.options.got, this.options.cheerio);
  }
  private _initManager() {
    this.manager = new Manager(this.options.manager, this);
    this.manager.onIdle().then(async () => {
      for (const pl of this._plugins.finish) {
        await pl.finish(this);
      }
      if (this.options.drain) await this.options.drain(this);
    });
  }
  private _initPlugins() {
    this.plugins = {};
    this._plugins = {
      before: [],
      after: [],
      finish: [],
      onError: []
    };

    // ues default plugins

    this.use(plugins._delay(this.options.delay || 0));
    //
    this.use(plugins._attempt(this.options.attempts));
    this.use(plugins._parse());
    this.use(plugins._follow());
  }
  async use(plugin: Plugin) {
    if (this.plugins.hasOwnProperty(plugin.name))
      throw `Duplicate plugin name:${plugin.name}`;
    this.plugins[plugin.name] = plugin;
    Object.keys(this._plugins).forEach(pos => {
      let array = this._plugins[pos];
      if (plugin[pos] && typeof plugin[pos] === "function") array.push(plugin);
      array.sort((a: Plugin, b: Plugin) => cmpPlugin(a, b, pos));
    });
    if (plugin.start && typeof plugin.start === "function") {
      await plugin.start(this);
    }
    return plugin;
  }
  async handleTask(task: Task, pos: string) {
    for (const plugin of this._plugins[pos]) {
      if (task.cancel) return;
      await plugin[pos](task, this);
    }
  }
  async handleTaskError(task: Task, err: Error) {
    for (const plugin of this._plugins.onError) {
      if (task.cancel) break;
      await plugin.onError(err, task, this);
    }
  }
  async add(task: Task | string | any, meta?: TaskMeta) {
    return this.manager.add(task, meta);
  }
  spawner(spawner: Spawner) {
    if (typeof spawner.spawn === "function") this.spawners.push(spawner);
  }

  get concurrency() {
    return this.options.concurrency;
  }
  set concurrency(newConcurrency: number) {
    // if (!(typeof newConcurrency === "number" && newConcurrency >= 1)) {
    //   throw new TypeError(
    //     `Expected \`concurrency\` to be a number from 1 and up, got \`${newConcurrency}\` (${typeof newConcurrency})`
    //   );
    // }
    this.options.concurrency = newConcurrency;
  }
  resolve(task: Task) {
    return this.manager.resolve(task);
  }
  reject(error: any, task: Task) {
    return this.manager.reject(error, task);
  }
}
