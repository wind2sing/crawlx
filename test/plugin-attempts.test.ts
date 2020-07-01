import x from "../source";
const X = x;
jest.setTimeout(10000);
test("retry count should be 0", async () => {
  let counter = 0;
  let attempts = 0;
  const x = X.create({ attempts });
  await x.use({
    name: "test-it",
    priority: -10,
    onError(err, task) {
      counter = task.meta.retries;
    }
  });
  await x({ url: "invalidUrl.com" });
  expect(counter - 1).toEqual(attempts);
});

test("retry count should be 4", async () => {
  let counter = 0;
  let attempts = 4;
  const x = X.create({ attempts: [5, [503]] });
  await x.use({
    name: "test-it",
    priority: -10,
    onError(err, task) {
      counter = task.meta.retries;
    }
  });
  await X({
    url: "http://httpbin.org/status/340"
  });
  expect(counter).toEqual(0);
  const task = await x({ url: "invalidUrl.com", attempts }, { id: "123456" });
  expect(counter - 1).toEqual(attempts);
  expect(task.meta.id).toEqual("123456");
});

test("503 status should be allowed", async () => {
  let counter = 0;
  await X({
    url: "http://httpbin.org/status/503",
    attempts: [
      2,
      [503],
      ({ shouldRetry }) => {
        if (shouldRetry) counter += 1;
        return true;
      }
    ]
  });
  expect(counter).toEqual(0);
});

test("spawner mode retry should works", async () => {
  let counter = 0;
  let attempts = 2;
  const x = X.create({ attempts });
  await x.use({
    name: "test-it",
    priority: -10,
    onError(err, task) {
      counter = task.meta.retries;
    }
  });
  x.spawner({
    validator: () => true,
    spawn: url => ({
      url,
      attempts: [
        attempts,
        [],
        ({ task, crawler }) => {
          if (task.url.includes("retry")) return true;
          else {
            crawler.reject("dummy error", task);
            return false;
          }
        }
      ]
    })
  });
  await x("invalidUrl-retry");
  expect(counter - 1).toEqual(attempts);
  try {
    await x("invalidUrl");
  } catch (error) {
    expect(error).toBe("dummy error");
  }
  expect(counter - 1).toEqual(0);
});
