import { parse } from "crawlx-parse";

function getRules(task) {
  let follows = [];
  if (task.follow) follows.push(task.follow);
  if (task.follows) follows = follows.concat(task.follows);
  return follows;
}

function shouldFollow(task): boolean {
  return (task.follow || task.follows) && task.res && task.res.$;
}
export default function getPlugin() {
  return {
    name: "follow",
    priority: 0,
    async after(task, crawler) {
      if (!shouldFollow(task)) return;
      let follows = getRules(task);
      for (const follow of follows) {
        let [
          selector,
          callback = r => r,
          filter = rs => rs.filter(v => v)
        ] = follow;
        let parsed = parse(selector, task.res.$, crawler.options.filters);
        // parsed result should always be array
        if (!Array.isArray(parsed)) parsed = [parsed];
        let urls = filter(parsed);
        let tasks = urls.map(url => callback(url)).filter(v => v);
        for (const task of tasks) {
          // spawner mode
          if (Array.isArray(task)) crawler.add(...task);
          // normal mode
          else crawler.add(task);
        }
      }
    }
  };
}
