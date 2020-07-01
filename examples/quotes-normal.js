const x = require("crawlx").default.create({ concurrency: 5, attempts: 2 });

x({
  url: "http://quotes.toscrape.com/",
  parse: [
    "[.quote]",
    {
      author: ".author",
      authorUrl: ".author+a@href",
      text: ".text",
      tags: "[a.tag]"
    }
  ],
  follow: ["[.author+a@href]", followAuthorRule]
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
