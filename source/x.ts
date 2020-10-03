import { CrawlerOptions, X } from "./index";
import { Crawler } from "./crawler";
import deepmerge from "deepmerge";

export const defaultCrawlerOptions: CrawlerOptions = {
  concurrency: 2,
  got: {
    retry: 0,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36",
    },
  },
  attempts: 1,
  manager: {
    autoStart: true,
  },
};

export default function createX(options: CrawlerOptions = {}) {
  const x: X = function (task, meta) {
    return x.crawler.add(task, meta);
  };

  x.crawler = new Crawler(deepmerge(defaultCrawlerOptions, options));
  x.agent = x.crawler.agent;
  x.agentOptions = x.crawler.agentOptions;
  x.store = x.crawler.store;

  x.use = function (plugin) {
    return x.crawler.use(plugin);
  };
  x.spawner = function (spawner) {
    return x.crawler.spawner(spawner);
  };
  x.create = function (options: CrawlerOptions = {}) {
    return createX(deepmerge(this.crawler.options, options));
  };

  x.res = function (task, meta) {
    return x.crawler.add(task, meta).then(({ res }) => res);
  };

  x.body = function (task, meta) {
    return x.crawler.add(task, meta).then(({ res }) => res.body);
  };

  x.parse = function (task, meta) {
    return x.crawler.add(task, meta).then(({ parsed }) => parsed);
  };

  return x;
}
