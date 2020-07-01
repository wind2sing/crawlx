import agent from "../source/agent";
test("agent initialization", async () => {
  let headers = { "user-agent": "tester" };
  let a = agent({ headers });
  expect(a.defaults.options.headers).toStrictEqual(headers);
  a = agent();
  expect(a.defaults.options.headers).toStrictEqual({
    "user-agent": "got (https://github.com/sindresorhus/got)"
  });
});
