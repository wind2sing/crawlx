export default function getPlugin({
  defaultProtocol = "http:",
  normalizeProtocol = true,
  forceHttp = false,
  forceHttps = false,
  stripAuthentication = true,
  stripHash = false,
  stripWWW = true,
  removeQueryParameters = [/^utm_\w+/i],
  removeTrailingSlash = true,
  removeDirectoryIndex = false,
  sortQueryParameters = true,
} = {}) {
  const normalizeUrl = require("normalize-url");
  let options = {
    defaultProtocol,
    normalizeProtocol,
    forceHttp,
    forceHttps,
    stripAuthentication,
    stripHash,
    stripWWW,
    removeQueryParameters,
    removeTrailingSlash,
    removeDirectoryIndex,
    sortQueryParameters,
  };

  return {
    name: "dupFilter",
    priority: 95,
    normalizeUrl,
    async start(crawler) {
      if (!crawler.store.dupFilter) crawler.store.dupFilter = new Set();
      else {
        console.log(
          `dupfilter set already exists:${crawler.store.dupFilter.size}`
        );
      }
    },
    async before(task, crawler) {
      const normalized = normalizeUrl(task.url, options);
      if (crawler.store.dupFilter.has(normalized)) task.cancel = true;
      else crawler.store.dupFilter.add(normalized);
    },
    async onError(err, task, crawler) {
      const normalized = normalizeUrl(task.url, options);
      crawler.store.dupFilter.delete(normalized);
    },
  };
}

module.exports = getPlugin;
