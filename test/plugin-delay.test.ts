import x from "../source/index";

test("delay 100ms", async () => {
  let t = { url: "invalid", attempts: 0, delay: 100 };
  let called = false;
  Object.defineProperty(t, "delay", {
    get() {
      called = true;
      return 100;
    }
  });
  await x(t);
  expect(called).toBe(true);
});
