import x from "../source";
import { plugins } from "../source";
const X = x;
test("dupFilter plugin", async () => {
  let count = 0;
  const x = X.create({ attempts: 0 });
  await x.crawler.use(plugins.dupFilter());
  await x.use({
    name: "count-it",
    priority: -100,
    before: () => {
      count += 1;
    },
  });
  await x({
    url: "http://httpbin.org/status/200",
  });
  await x({
    url: "http://httpbin.org/status/200",
  });
  expect(count).toBe(1);
});

test("dupFilter plugin onError", async () => {
  const x = X.create({ attempts: 2});
  await x.crawler.use(plugins.dupFilter());
  let count = 0;
  await x.use({
    name: "fix-error",
    priority: -100,
    before() {
      count += 1;
    },
  });
  await x({ url: "http://httpbin.org/status/404" });
  expect(count).toEqual(3)
});
test("dupFilter plugin store", async () => {
  let count = 0;
  const x = X.create({ attempts: 0 });
  const set = new Set();
  set.add(plugins.dupFilter().normalizeUrl("invalid"));
  x.crawler.store["dupFilter"] = set;
  await x.crawler.use(plugins.dupFilter());
  await x.use({
    name: "count-it",
    priority: -100,
    before: () => {
      count += 1;
    },
  });
  await x({
    url: "invalid",
  });

  expect(count).toBe(0);
});
