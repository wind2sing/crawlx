import x from "../source";
test("set concurrency", () => {
  const x2 = x.create({ concurrency: 2 });
  expect(x2.crawler.concurrency).toBe(2);
  expect(x2.crawler.options.concurrency).toBe(2);
  x2.crawler.concurrency = 3;
  expect(x2.crawler.concurrency).toBe(3);
});

test("autoStart", async () => {
  const x2 = x.create({ manager: { autoStart: false } });
  expect(x2.crawler.manager.isPaused).toBe(true);
  await x2.crawler.manager.start();
  await x2.crawler.manager.start();
  expect(x2.crawler.manager.isPaused).toBe(false);
  x2.crawler.manager.pause();
  expect(await x2.crawler.manager.getSize()).toBe(0);
  expect(x2.crawler.manager.pending).toBe(0);
});

test("add spawner", async () => {
  const x2 = x.create({ attempts: 0 });
  x2.spawner({});
  expect(x2.crawler.spawners.length).toBe(0);
  x2.spawner({
    validator: () => false,
    spawn: () => ({
      url: ""
    })
  });
  x2.spawner({
    regex: /test/,
    spawn: () => ({
      url: ""
    })
  });
  await x2("");
  await x2("invalid-test");
  expect(x2.crawler.spawners.length).toBe(2);
});

test("crawler options", async () => {
  const x2 = x.create({
    concurrency: 0,
    attempts: 0,
    manager: { autoStart: false }
  });
  let count = 0;
  x2.crawler.manager.onEmpty().then(() => {
    count += 1;
  });
  expect(await x2.crawler.manager._tryToStartAnother()).toBe(false);
  await x2.crawler.manager.start();
  expect(await x2.crawler.manager._tryToStartAnother()).toBe(false);
  x2.crawler.concurrency = 2;
  await Promise.all([x2({ url: "invalid" }), x2.crawler.manager._next()]);
  expect(count).toBe(1);
});

test("crawler rejects task", async () => {
  const x2 = x.create();
  try {
    await x2({
      url: "http://httpbin.org/status/200",
      callback() {
        throw "dummy error";
      }
    });
  } catch (error) {
    expect(error).toBe("dummy error");
  }
});
