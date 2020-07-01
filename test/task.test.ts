import { taskCmp } from "../source/task";

test("task compare", () => {
  let a = { url: "", priority: 1 };
  let b = { url: "", priority: 2 };
  let a2 = { url: "", priority: 1 };
  expect(taskCmp(a, b)).toEqual(-1);
  expect(taskCmp(b, a)).toEqual(1);
  expect(taskCmp(a, a2)).toEqual(0);
});
test("task default priority should be 0", () => {
  let c = { url: "" };
  let c2 = { url: "", priority: 0 };
  expect(taskCmp(c, c2)).toEqual(0);
});
