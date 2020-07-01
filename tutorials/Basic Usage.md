## x Function

`x` is a shorthand function to push task into crawler's task queue;

In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports, use the following approach:

```js
const x = require("crawlx").default;
```

After execution of http request, you can use `callback` to handle response in task's option or use Promise interface with `x` directly. `res` property will be added on `task` object after request.

```js
let task = {
  url: "http://books.toscrape.com/",
  callback({ res }) {
    console.log(res.statusCode); // 200
  }
};
x(task).then(task => {
  console.log(task.res.statusCode); // 200
});
```

Access crawler with `x`

```js
x.crawler;
x.agent; // x.crawler.agent; got instance
x.agentOptions.headers["Cookie"] = "name=jack"; // x.crawler.agent.defaults.options
```

## Task options

`crawlx` use [got](https://www.npmjs.com/package/got) to make http requests.

```js
task = {
  url: "https://www.example.com",

  // callback function after finishing http request
  callback(task, cralwer) {},

  // task with higher priority will be executed earlier
  priority: 0,

  // additional key-value pairs will be passed to agent's request options
  // full list: https://github.com/sindresorhus/got

  headers: {},
  method: "POST",
  params: {},
  body: {}
};
```

## Extend instance

Create new instance with options.

```js
const x = require("crawlx").default;

const crawlerOptions = { concurrency: 10 };
const x2 = x.create(crawlerOptions);
```

```js
{
  concurrency: 1,

  // cheerio options
  cheerio: {
    keepRelativeUrl: false, // don't transform relative url to absolute
    disable: false // disable cheerio plugin on response
  },

  // got options for creating instance
  got: {}
};
```

You can access crawler instance with `x.crawler` and `got` instance with `x.agent` or `x.crawler.agent`.

```js
x.agent.defaults.options.prefixUrl = "https://example.com";
x.agentOptions = "https://example.com";
```
