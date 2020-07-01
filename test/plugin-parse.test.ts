import x from "../source";
jest.setTimeout(10000);
test("parse empty", async () => {
  let parsed;
  ({ parsed } = await x({
    url: "http://httpbin.org",
    parse: ""
  }));
  expect(parsed).toBe(undefined);
});
test("parse check", async () => {
  let parsed;
  ({ parsed } = await x({
    url: "http://httpbin.org/status/201",
    parseCheck: res => {
      if (res.statusCode === 200) return true;
    },
    parse: "title"
  }));
  expect(parsed).toBe(undefined);
});
test("parse json content", async () => {
  let parsed;
  ({ parsed } = await x({
    url: "http://httpbin.org/status/200",
    parse: "title"
  }));
  expect(parsed).toBe(undefined);
});
