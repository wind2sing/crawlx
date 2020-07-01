## Basic plugins

### parse plugin

Enabled by default. Parse html content with complex rules. After task's execution, a `parsed` property will be added on `task`.

Options for task

```js
task = {
  ...
  parse: "title",

  parseCheck(res) {return true;}, //optional
  callback(task) {
    console.log(task.parsed);
  }
}
```

if `parseCheck` is a function, it will be called first. Return true if you want to continue the parsing execution. You can also change parse rule dynamically in the funtion.



Options for crawler

```js
{
  ...
  filters: {
    trim: v=>v.trim()
  }
}
```

- Select an object

```js
task = {
  ...
  parse: { title: "title", warning: ".alert" },
}
```

- Select an array

```js
task = {
  ...
  // starts with '[' and ends with ']'
  parse: "[ul li a @href]"
}
```

- Using scope

```js
task = {
  ...
  // first element of array: scope selector
  // scope selector and use `[]` to process an array for divisions
  // second element of array: element selector
  parse: ["[ul li]", "a @href"]
}
```

- Select array of objects

```js
task = {
  ...
  parse: ["[.product_pod]", { title: "h3 a" }]
}
```

- Available attributes

```js
"@html";
"@outerHtml";
"@text"; // default
"@string"; // direct text node's value
"@nextNode"; // next dom node's value
```

- Using filters

To apply filters to a value, append them to the selector using `|`.

```js
task = {
  parse: "title | trim"
};
```

Or using array format to provide functions directly

```js
task = {
  parse: ["title", s => s.trim()]
};
```

To register filters on the instance, use `filters` property in crawler's options.

### attempt plugin

Enabled by default. In addition to letting the `got` library handle retry, we can also handle it through this attempt plugin.

Options for crawler and task.

```js
{
  // [retries, allowedStatuses, callback({ err, shouldRetry, maxRetry, task, crawler })]
  attempts: [3, [404]];
  // or simply a number
  attempts: 3;
}
```

Default Callback function will log the error to console and re-add or resolve the task based on shouldRetry variable.
When providing your own callback, defaultCallback will not be called. So make sure that the task will be resolved.
But you can also return true value in your custom callback function and the plugin will call default Callback function automatically.



### delay plugin

Enabled by default.

Options for task

```js
{
  // the number of milliseconds to wait before sending http request
  delay: 3000;
}
```



### follow plugin

Enabled by default.

Prerequisite: parse plugin



Workflow for this plugin: selector-parse => filterFunction => callback for each

Selector for parsing new urls and Callback function are required
Callback function should receive a url as parameter and return a task
FilterFunction will be used to filter selected results. And Default filter function on urls from selector is: `urls=>urls.filter(v=>v)`



```JS
let selector = '[a@href]';
let callbackFunc = url=>({url,parse:"title",callback(task){...}});
let followRule = [selector, callbackFunc, filter=urls=>urls.filter(v=>v)]
```



Spawner mode is also supported: False callback will enable spawner mode for selected urls;

```js
let followRule2 = ['[a@href]']
```

Options for task

```js

let task = {
  ...
  follow: followRule
  // or use follows: Array of followRule
  follows: [followRule1, followRule2]
}
...
function xMain(url) {
  return {
    // main page task
    url,
    parse: [
      // divide by '.quote' selector
      "[.quote]",
      // rule on each division
      {
        author: ".author",
        authorUrl: ".author+a@href",
        text: ".text | slice:0,20",
        tags: "[a.tag]"
      }
    ],
    follow: [".next a@href", xMain]
  };
}

x(xMain('http://quotes.toscrape.com/'))
```

```bash
$ DEBUG=crawlx* node quotes.js
  crawlx GET http://quotes.toscrape.com/ -> 200 +0ms
  crawlx GET http://quotes.toscrape.com/page/2/ -> 200 +1s
  crawlx GET http://quotes.toscrape.com/page/3/ -> 200 +822ms
  crawlx GET http://quotes.toscrape.com/page/4/ -> 200 +1s
  crawlx GET http://quotes.toscrape.com/page/5/ -> 200 +648ms
  crawlx GET http://quotes.toscrape.com/page/6/ -> 200 +996ms
  crawlx GET http://quotes.toscrape.com/page/7/ -> 200 +695ms
  crawlx GET http://quotes.toscrape.com/page/8/ -> 200 +2s
  crawlx GET http://quotes.toscrape.com/page/9/ -> 200 +712ms
  crawlx GET http://quotes.toscrape.com/page/10/ -> 200 +646ms
```



### dupFilter plugin

Disabled by default.

Prerequisite: [normalize-url - npm](https://www.npmjs.com/package/normalize-url)

```bash
$ npm i normalize-url
```

Usage:

```js
const x = require("crawlx").default;
const plugins = require("crawlx").plugins;

x.crawler.use(plugins.dupFilter());
// options for normalize-url
x.crawler.use(plugins.dupFilter({ stripHash: true }));
```

Options for task

```js
{
  // set to true if the task should not be filtered by dupFilter plugin
  dontFilter: true;
}
```

### other plugins

- [crawlx-cloudscraper - npm](https://www.npmjs.com/package/crawlx-cloudscraper)

## Others

### Plugin Structure

```js
const getPlugin = options => ({
  name: "",
  priority: 0,
  before: (task, crawler) => {},
  after: (task, crawler) => {},
  start: crawler => {},
  finish: crawler => {},
  onError: (error, task, crawler) => {}
});
```

### Enable plugin in order

Sometimes plugins should be enabled in order(start method should be called in order). For example, resume plugin will save & load dupFilter set as well. So resume plugin should be enabled first.

```js
(async () => {
  await x.crawler.use(pluginA);
  await x.crawler.use(pluginB);

  x("http://quotes.toscrape.com/");
})();
```
