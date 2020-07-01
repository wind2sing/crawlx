## Plugin Structure

A plugin is a object contains following properties.

- `name`: required as identifier for different plugins.
- `priority`: plugin with higher number will be executed earlier, default to 0.
- `priorities`: Alternative way for setting priorities with an object.
- `before`,`after`: called before and after http request.
- `start`: called when plugin is registered;
- `finish`: called when task queue is empty and pending count is 0.


```js
const getPlugin = options => ({
  name: "myPlugin",
  priority: 10,
  priorities: {before:100}, 
  // Final priorities: before = 100; after,finish = 10;
  before: (task, crawler) => {},
  after: (task, crawler) => {},
  start: crawler => {},
  finish: crawler => {},
  onError: (error, task, crawler) => {}
});
```



## Register Plugin

Plugin's `start `method will be called immediately when it is registered on the crawler.

```js
const x = require("crawlx").default;
x.use(getPlugin())
```





## Enable plugin in order

Sometimes plugins should be enabled in order(start method should be called in order). For example, resume plugin will save & load dupFilter set as well. So resume plugin should be enabled first.

```js
(async () => {
  await x.crawler.use(pluginA);
  await x.crawler.use(pluginB);

  x("http://quotes.toscrape.com/");
})();
```