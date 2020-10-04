import x from "../source/index";

test("delay 100ms", async () => {
  const x2 = x.create();
  let t = { url: "invalid", attempts: 0, delay: 100 };
  let called = false;
  Object.defineProperty(t, "delay", {
    get() {
      called = true;
      return 100;
    },
  });
  await x2(t);
  expect(called).toBe(true);
});

test("delay 1000ms globally", async () => {
  const x2 = x.create({ delay: 1000 });
  let called = false;
  await x2.use({
    name: "mark-it",
    priority: -100,
    onError(err, task) {
      called = true;
    },
  });
  let t = { url: "http://httpbin.org/status/404", attempts: 0 };

  x2(t);

  setTimeout(() => {
    expect(called).toBe(false);
  }, 500);

  return new Promise((resolve) => {
    setTimeout(() => {
      expect(called).toBe(true);
      resolve();
    }, 4000);
  });
});
