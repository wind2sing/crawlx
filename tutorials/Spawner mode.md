First we need to register some spawners on the crawler.

In spawner mode, `x` accepts a `url` string (with optional `meta` object) and then passes the `url` to spawners for validating and spawning new Task.

There are two ways for spawner to accept a url string.

- regex.test(url) should be true
- validator(url, meta) should return true

If a url string and its meta object is valided by **one of** these two methods, it will be spawned into a normal Task object furthur.

The order to register spawners is important because crawler will call spawners one by one to validate urls. If one spawner matches the url, crawler will stop validating others.

```js
x.spawner({
  // regex validator or function validator
  regex: /quotes\.toscrape\.com\/author/,
  // alternative way: use function directly to validate
  validator(url, meta) {
    if (url.includes("author")) return true;
  },
  // spawn(url, meta), should return a task object
  spawn: url => ({
    url,
    parse: {
      name: ["h3 | reverse", v => v.toUpperCase()],
      born: ".author-born-date | date"
    },
    callback({ res, parsed }) {
      console.log(res.statusCode);
    }
  })
});

x.spawner({
  regex: /quotes\.toscrape\.com\//,
  spawn: url => ({
    // main page task
    url,
    timeout: 5000,
    parse: [
      "[.quote]",
      {
        author: ".author",
        authorUrl: ".author+a@href",
        text: ".text | slice:0,20",
        tags: "[a.tag]"
      },
      s => ((s["type"] = "quote"), s)
    ],
    follow: ["[.author+a@href]"]
  })
});

// x(url, meta)
x("http://quotes.toscrape.com/");
```
