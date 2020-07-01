const x = require("crawlx").default.create({ concurrency: 4, attempts: 2 });

x.spawner({
  regex: /quotes\.toscrape\.com\/author/,
  spawn: url => ({
    url,
    parse: {
      name: ["h3 | reverse", v => v.toUpperCase()],
      born: ".author-born-date | date"
    },
    callback({ res, parsed }) {
      console.log(res.statusCode, parsed);
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
    // use spawner follow mode
    follow: ["[.author+a@href]"]
  })
});

x("http://quotes.toscrape.com/");
