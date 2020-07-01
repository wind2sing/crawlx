# crawlx

<p>
  <a href='https://travis-ci.com/wind2sing/crawlx'>
  	<img src='https://travis-ci.com/wind2sing/crawlx.svg?branch=master' alt='Build Status'>
  </a>
  <a href='https://crawlx.js.org'>
		<img src='https://img.shields.io/badge/docs-js.org-green' alt='docs'>
	</a>
  <a href='https://www.npmjs.com/package/crawlx'>
    <img alt="npm" src="https://img.shields.io/npm/v/crawlx">
    <img alt="NPM" src="https://img.shields.io/npm/l/crawlx">
  </a>
  <a href="https://codeclimate.com/github/wind2sing/crawlx/maintainability">
    <img src="https://api.codeclimate.com/v1/badges/05376651517a336c20b8/maintainability" />
  </a>
  <a href='https://coveralls.io/github/wind2sing/crawlx?branch=master'>
    <img src='https://coveralls.io/repos/github/wind2sing/crawlx/badge.svg?branch=master' alt='Coverage Status' />
  </a>
  </p>

⚡Lightweight web crawler with powerful plugins!

```js
const x = require("crawlx").default;

x({
  url: "http://quotes.toscrape.com/",
  parse: [
    "[.quote]",
    {
      author: ".author",
      authorUrl: ".author+a@href",
      text: ".text",
      tags: "[a.tag]",
      type: () => "quote"
    },
    s => ((s["crawled"] = new Date()), s)
  ],
  follow: ["[.author+a@href]", followAuthorRule]
}).then(task => {
  console.log(task.parsed);
});

function followAuthorRule(url) {
  return {
    url,
    parse: {
      name: ["h3 | reverse", v => v.toUpperCase()],
      born: ".author-born-date | date"
    },
    callback(task) {
      console.log(task.parsed);
    }
  };
}
```

## Features

- Make http request with [got](https://github.com/sindresorhus/got)
- Priority queue of requests
- Simple plugin system
- Promise support
- Flexible schema with powerful parse plugin, using only one rule object
- Easily paginate and follow links with builtin follow plugin
- Spawner mode: add a url directly

## Installation

```bash
npm install crawlx
```

## Documentation

Documentaition: [crawlx.js.org](https://crawlx.js.org/)

See more examples: [crawlx/examples](https://github.com/wind2sing/crawlx/tree/master/examples)
