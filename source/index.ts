import { Options, Response } from "got";
import { CheerioOptions, Agent, AgentOptions } from "./agent";
import { Crawler } from "./crawler";
import createX from "./x";
import * as plugins from "./plugins";
import { Plugin } from "./plugin";

/**
 *  Use x to do everything!
 *  x is a function to enqueue a `Task`(or url string in spawner mode) with optional `TaskMeta`.
 *```js
 *  const x = require('crawlx').default;
 *  const x_my = x.create({concurrency:1});
 *  x_my({url:"https://www.google.com", parse:"title"})
 *```
 *
 */
export interface X {
  /**
   * task
   */
  (task: Task | string, meta?: TaskMeta): Promise<Task>;
  /**
   * Create a new instace by merging options.
   */
  create: (options?: CrawlerOptions) => X;
  /**
   * Access to crawler instance.
   */
  crawler: Crawler;

  /**
   * Got agent.
   *
   */
  agent: Agent;
  /**
   * Got agent's options
   */
  agentOptions: AgentOptions;
  /**
   * Storage object for the crawler.
   */
  store: object;
  /**
   * Register a plugin.
   * @param {Plugin} plugin
   */
  use: (plugin: Plugin) => Promise<any>;
  /**
   * Register a spawner
   */
  spawner: (spawner: Spawner) => any;

  /**
   * Shorthands
   */
  res: (task: Task | string, meta?: TaskMeta) => Promise<Response>;
  body: (task: Task | string, meta?: TaskMeta) => Promise<any>;
  parse: (task: Task | string, meta?: TaskMeta) => Promise<any>;

  [prop: string]: any;
}

/**
 * Rules for generating a new Task from url and taskMeta.
 * ```js
 * x.spawner({
 *  regex: /forum\/page-\d+/,
 *  spawn: (url, meta)=>({
 *    url,
 *    parse: "title",
 *    callback(task){
 *      console.log(task.res.statusCode);
 *    }
 *  })
 * })
 *
 * x("http://example.com/forum/page-2", {metakey:'metavalue'})
 * ```
 */
export interface Spawner {
  /**
   * Regex expression for validating urls.
   */
  regex?: RegExp;
  /**
   * Direct function for validating urls.
   */
  validator?: (url: string, meta: TaskMeta) => boolean;
  /**
   * Spawn function should return a task object.
   */
  spawn?: (url: string, meta: TaskMeta) => Task;
}
/**
 * Options to initialize crawler instance or create new instance.
 */
export interface CrawlerOptions {
  /**
   * Set concurrency limit(default:5)
   */
  concurrency?: number;
  /**
   * Passed to got. See [got](https://github.com/sindresorhus/got).
   */
  got?: AgentOptions;
  cheerio?: CheerioOptions;
  manager?: { autoStart: boolean };
  drain?: (crawler: Crawler) => any;
  /**
   * Register filter-functions for plugin-parse.
   */
  filters?: object;

  /**
   * Attempt rule for plugin-retry(default: 0).
   */
  attempts?: AttempRule;
  [prop: string]: any;
}

/**
 * TaskMeta is an object for containing essential information about the task.
 * It is quite important for spawner mode and plugin's data storage.
 */
export interface TaskMeta {
  /**
   * Auto generated unique string ID.
   */
  id?: string;
  [prop: string]: any;
}

/**
 * Task holds information to execute.
 * This is non-spawned task structure as an object.
 */
export interface Task extends Options {
  /**
   * Url for http request.
   */
  url: string;
  /**
   * Callback function. Called before resolving the task.
   */
  callback?: (task: Task, crawler: Crawler) => any;
  /**
   * Meta object for task.
   */
  meta?: TaskMeta;
  /**
   * Task with higher priority will be executed first.
   */
  priority?: number;
  spawned?: boolean;

  /**
   * Setting cancel to `true` will make crawler stop the execution of the task immediately.
   */
  cancel?: true;

  /**
   * Response hooked after http request. See [got](https://github.com/sindresorhus/got)
   */
  res?: Response;

  /**
   * Error hooked after an error throwed during http request.
   */
  err?: Error;

  /**
   * parsing rule for plugin-parse.
   */
  parse?: any;

  /**
   * check before parsing if it exists,
   * return true if you want to continue the parsing execution
   */
  parseCheck?: (res: Response) => boolean;
  /**
   * parsed result from plugin-parse.
   */
  parsed?: any;

  /**
   * delay in ms for plugin-delay.
   */
  delay?: number;

  /**
   * rule for plugin-follow: `[selector, taskFactoryFunc, filter=urls=>urls.filter(v=>v)]`.
   * workflow:selector-parse => filterFunction => taskFactoryFunc for each
   */
  follow?: FollowRule;
  /**
   * set of rules for plugin-follow.
   */
  follows?: FollowRules;

  /**
   * `retries` or `[retries, allowedStatuses, callback({ err, shouldRetry, task, crawler })]`.
   * Rule for plugin-attempt
   */
  attempts?: AttempRule;
  [prop: string]: any;
}

export type FollowRule =
  | [string]
  | [string, (u: any) => Task | string | Array<any>]
  | [
      string,
      (u: any) => Task | string | Array<any>,
      (parsed: Array<any>) => Array<any>
    ];

export type FollowRules = Array<FollowRule>;

export type AttempRule =
  | number
  | [number, Array<number>]
  | [
      number,
      Array<number>,
      (options: {
        err: Error;
        shouldRetry: boolean;
        task: Task;
        crawler: Crawler;
      }) => any
    ];

const x = createX();
export default x;
export { plugins };

module.exports = x;
module.exports.default = x;
module.exports.plugins = plugins;
