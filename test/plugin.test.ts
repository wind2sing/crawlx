import x from "../source";
import { cmpPlugin } from "../source/plugin";
test("add duplicate plugin", async () => {
  await x.use({
    name: "a"
  });
  try {
    await x.use({
      name: "a"
    });
  } catch (error) {
    expect(error).toBe("Duplicate plugin name:a");
  }
});
test("plugin start & finish function", async () => {
  let called = 100;
  const x2 = x.create({
    drain: () => {
      called += 1;
    }
  });
  await x2.use({
    name: "end",
    start: () => {
      called = 0;
    },
    finish: () => {
      called += 1;
    }
  });
  await x2({ url: "invalidUrl", attempts: 0 });
  expect(called).toEqual(2);
});

test("plugin compare", async () => {
  const p0 = { name: "p0" };
  const p1 = { name: "p1", priorities: { before: 200 } };
  const p2 = { name: "p2", priorities: { before: 200 } };
  expect(cmpPlugin(p1, p2, "before")).toBe(0);
  expect(cmpPlugin(p1, p0, "before")).toBe(-1);
});

test("plugin cancel", async () => {
  let called = 0;
  const x2 = x.create({});
  await x2.use({
    name: "cancel-it",
    priority: 150,
    priorities: { before: 200, onError: 200 },
    before: task => {
      if (!task.url.startsWith("http")) task.cancel = true;
    },

    onError: (err, task, crawler) => {
      called += 1;
      task.cancel = true;
      crawler.resolve(task);
    }
  });
  await x2({ url: "invalidUrl" });
  expect(called).toEqual(0);
  await x2({ url: "httpInvalid", attempts: 2 });
  await x2({
    url: "http://httpbin.org/status/200",
    callback() {
      called += 1;
    }
  });
  expect(called).toEqual(2);
});
