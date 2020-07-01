import { Task } from "../index";
import { Crawler } from "../crawler";
function shouldRetryIt(res, allowedStatuses: Array<number>) {
  if (!(res && res.statusCode)) return true;
  const status = res.statusCode;
  return !(
    (status < 400 && status >= 200) ||
    allowedStatuses.indexOf(status) !== -1
  );
}

function mergeAttemptsOptions(opt: Array<any>, other: number | Array<any>) {
  if (typeof other === "number") return [other, opt[1], opt[2]];
  else if (Array.isArray(other)) {
    return [other[0], other[1], other[2] || opt[2]];
  } else return [...opt];
}

function defaultCallback({ err, shouldRetry, task, crawler, maxRetry }) {
  if (shouldRetry) {
    console.error(
      `retry(${task.meta.retries}/${maxRetry}) ${task.url}: ${err}`
    );
    if (task.spawned) {
      task = { url: task.url, meta: task.meta };
      crawler.add(task.url, task.meta);
    } else crawler.add(task);
  } else {
    console.error(`Drop ${task.url}: ${err}`);
    crawler.resolve(task);
  }
}

function before(task: Task) {
  delete task.err;
}
export default function getPlugin(options) {
  let defaultAttemptsOptions = [0, [], defaultCallback];
  defaultAttemptsOptions = mergeAttemptsOptions(
    defaultAttemptsOptions,
    options
  );
  return {
    name: "attempt",
    priority: 100,
    before,
    async onError(err: Error, task: Task, crawler: Crawler) {
      // extract retry options from task
      let [maxRetry, allowedStatuses, callback] = mergeAttemptsOptions(
        defaultAttemptsOptions,
        task.attempts
      );
      if (!task.meta.retries) task.meta.retries = 0;
      task.meta.retries += 1;
      // should retry?
      let shouldRetry: boolean =
        shouldRetryIt(task.res, allowedStatuses) &&
        task.meta.retries <= maxRetry;
      let options = {
        err,
        shouldRetry,
        maxRetry,
        task,
        crawler
      };
      let defaultAgain = await callback(options);
      if (defaultAgain) defaultCallback(options);
    }
  };
}
