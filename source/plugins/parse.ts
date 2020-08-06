import cparse from "cparse";
const { parse } = cparse;

function parseCheckNotAllowed(task): boolean {
  return task.parseCheck && !task.parseCheck(task.res);
}
function validTask(task): boolean {
  return task.parse && task.res && task.res.$;
}
export default function getPlugin() {
  return {
    name: "parse",
    priority: 80,
    parse,
    after(task, crawler) {
      if (parseCheckNotAllowed(task)) return;
      if (!validTask(task)) return;
      task.parsed = parse(task.parse, task.res.$, crawler.options.filters);
    },
  };
}
