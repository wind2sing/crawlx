import { Task } from "./index";
export function taskCmp(a: Task, b: Task) {
  const pa = a.priority || 0,
    pb = b.priority || 0;
  return pa < pb ? -1 : pa > pb ? 1 : 0;
}
export function getGotOptionsFromTask(t: Task): any {
  let {
    url,
    callback,
    meta,
    priority,
    spawned,
    res,
    err,
    cancel,
    isStream,
    ...options
  } = t;
  let result = {};
  Object.assign(result, options);
  return result;
}
