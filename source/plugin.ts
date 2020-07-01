import { Crawler } from "./crawler";
import { Task } from "./index";

export interface PriorityMap {
  before?: number;
  after?: number;
  finish?: number;
  onError?: number;
}
/**
 * Basic plugin structure.
 */
export interface Plugin {
  /**
   * Identifier for the plugin.
   */
  name: string;
  /**
   * Plugin with higher priority will be executed first.
   */
  priority?: number;
  /**
   * Alternative setting for priorities.
   * ```js
   * {
   *  before: 100,
   *  after: 90,
   *  onError: 40
   * }
   * ```
   */
  priorities?: PriorityMap;
  /**
   * Called before task's execution
   */
  before?: (task: Task, crawler: Crawler) => any;
  /**
   * Called after task's execution
   */
  after?: (task: Task, crawler: Crawler) => any;
  /**
   * Called when registered on the Crawler
   */
  start?: (crawler: Crawler) => any;
  /**
   * Called when all tasks are finished.
   */
  finish?: (crawler: Crawler) => any;
  /**
   * Called when an error is throwed during http request.
   */
  onError?: (error: Error, task: Task, crawler: Crawler) => any;
}

export interface PluginMap {
  [name: string]: Plugin;
}

export interface PluginActionMap {
  before: Array<Plugin>;
  after: Array<Plugin>;
  finish: Array<Plugin>;
  onError: Array<Plugin>;
}

function priorityOfPlugin(a: Plugin, pos: string) {
  return (a.priorities && a.priorities[pos]) || a.priority || 0;
}
export function cmpPlugin(a: Plugin, b: Plugin, pos: string) {
  let pa = priorityOfPlugin(a, pos);
  let pb = priorityOfPlugin(b, pos);
  return pa > pb ? -1 : pa < pb ? 1 : 0;
}
