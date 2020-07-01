import x from "../source";
jest.setTimeout(10000);
test("follow rule", async () => {
  let count = 0;
  await x({ url: "http://httpbin.org", follow: ["[a@href]"] });
  await x({
    url: "http://httpbin.org",
    follows: [
      [
        "a @href",
        url => {
          count += 1;
          return [url];
        }
      ]
    ]
  });
  expect(count).toBe(1);
  await x({
    url: "http://httpbin.org",
    follow: [
      "a @href",
      url => {
        count += 1;
        return url;
      }
    ]
  });
  expect(count).toBe(2);
});
