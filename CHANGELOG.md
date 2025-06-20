# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.1] - 2025-06-15

### Added
- **Comparison filters**: Added missing comparison filters (`gt`, `gte`, `lt`, `lte`, `eq`, `ne`)
- **Utility filters**: Added utility filters (`empty`, `notEmpty`, `exists`)
- **Math operation filters**: Added math filters (`add`, `subtract`, `multiply`, `divide`, `round`, `abs`)
- **Comprehensive test suite**: Added `examples/test-new-filters.js` for testing new filters
- **Problem fixes documentation**: Added `PROBLEM_FIXES.md` with detailed fix report

### Fixed
- **Filter syntax**: Fixed filter syntax in examples from `gt(0)` to `gt:0`
- **Missing filters**: Resolved "Filter 'gt(0)' not found" errors in complex parsing rules
- **Examples compatibility**: All examples now pass 100% tests

### Improved
- **Filter system**: Enhanced filter system with 15 new utility filters
- **Test coverage**: Improved test coverage with comprehensive filter testing
- **Documentation**: Better documentation of filter usage and syntax

## [2.0.0] - 2024-01-XX

### Added

#### Core Features
- **Complete rewrite** of CrawlX with TypeScript for better type safety and developer experience
- **Dual mode operation**: Lightweight and high-performance modes for different use cases
- **Advanced plugin system** with built-in plugins and custom plugin support
- **Comprehensive configuration system** with environment variable support and validation
- **Task scheduling system** with priority queues and resource management
- **Structured logging** with multiple transports (console, file, memory)
- **Advanced error handling** with custom error types and recovery mechanisms

#### HTTP Client
- **Multi-mode HTTP client** with lightweight and high-performance implementations
- **Built-in Cheerio integration** for automatic HTML parsing
- **Connection pooling** and keep-alive support
- **Request/response interceptors** for custom processing
- **Automatic retry logic** with exponential backoff
- **Comprehensive statistics** and monitoring

#### Parser Engine
- **Enhanced CSS selector parsing** with advanced filter system
- **Scope-based parsing** for complex data structures
- **Custom filter support** for data transformation
- **Validation system** for parse rules
- **Performance optimizations** for large documents

#### Plugin System
- **ParsePlugin**: Advanced data extraction with validation
- **FollowPlugin**: Intelligent link following with depth control
- **RetryPlugin**: Configurable retry logic with circuit breaker
- **DelayPlugin**: Request delays and politeness features
- **DuplicateFilterPlugin**: URL deduplication with normalization
- **RateLimitPlugin**: Token bucket-based rate limiting

#### Configuration Management
- **Schema-based configuration** with validation
- **Environment variable support** with automatic type conversion
- **Configuration presets** for common use cases
- **Runtime configuration updates** with event notifications
- **Configuration import/export** for persistence

#### Developer Experience
- **Factory functions** for quick crawler creation
- **TypeScript definitions** for full type safety
- **Comprehensive examples** and documentation
- **Event-driven architecture** for monitoring and debugging
- **Statistics and monitoring** APIs

### Changed
- **Breaking**: Complete API redesign for better usability and consistency
- **Breaking**: New configuration format with nested structure
- **Breaking**: Plugin system completely rewritten
- **Breaking**: Minimum Node.js version increased to 16.0.0

### Improved
- **Performance**: Significant performance improvements in parsing and HTTP handling
- **Memory usage**: Better memory management and garbage collection
- **Error handling**: More descriptive errors with context information
- **Documentation**: Comprehensive documentation with examples
- **Testing**: Extensive test coverage with integration tests

### Dependencies
- **Added**: `undici` for high-performance HTTP client
- **Updated**: `cheerio` to latest version for better performance
- **Removed**: Legacy dependencies for smaller bundle size

---

## Previous Versions (1.x.x)

### [1.5.7](https://github.com/wind2sing/crawlx/compare/v1.5.6...v1.5.7) (2021-07-15)

### [1.5.6](https://github.com/wind2sing/crawlx/compare/v1.5.5...v1.5.6) (2021-07-14)


### Features

* crawler option: delay ([d646bf2](https://github.com/wind2sing/crawlx/commit/d646bf2ba8a5d3ec218e8bb471f3ddda1090a280))


### Bug Fixes

* dupFilter plugin allow errors ([c2f4641](https://github.com/wind2sing/crawlx/commit/c2f464183fc54241040434af64752cfdabb1bd10))

### [1.5.5](https://github.com/wind2sing/crawlx/compare/v1.5.4...v1.5.5) (2020-10-03)


### Features

* add three shorthand function ([ebd27f1](https://github.com/wind2sing/crawlx/commit/ebd27f11c4f447f350af7b4bd9c8ee12cc2e0981))


### Bug Fixes

* invalid test ([9ddcf31](https://github.com/wind2sing/crawlx/commit/9ddcf31345e52868cdd4b2c254cd77512c07729a))

### 1.5.4 (2020-08-06)

### [1.5.2](https://github.com/wooddance/crawlx/compare/v1.5.1...v1.5.2) (2020-04-20)


### Bug Fixes

* concurrency disfunction ([f9ac923](https://github.com/wooddance/crawlx/commit/f9ac923))



### [1.5.1](https://github.com/wooddance/crawlx/compare/v1.5.0...v1.5.1) (2020-02-03)



## [1.5.0](https://github.com/wooddance/crawlx/compare/v1.4.9...v1.5.0) (2020-02-02)



### [1.4.9](https://github.com/wooddance/crawlx/compare/v1.4.8...v1.4.9) (2020-02-02)


### Bug Fixes

* plugins option fallback ([ef9d029](https://github.com/wooddance/crawlx/commit/ef9d029))
* types change ([811d662](https://github.com/wooddance/crawlx/commit/811d662))


### Tests

* increse coverage ([974c63c](https://github.com/wooddance/crawlx/commit/974c63c))
* whole project ([e7db5d2](https://github.com/wooddance/crawlx/commit/e7db5d2))



### [1.4.8](https://github.com/wooddance/crawlx/compare/v1.4.7...v1.4.8) (2020-01-29)


### Features

* dupFilter plugin ([50400ae](https://github.com/wooddance/crawlx/commit/50400ae))



### [1.4.7](https://github.com/wooddance/crawlx/compare/v1.4.6...v1.4.7) (2020-01-26)


### Bug Fixes

* attempt counter logic ([d6fddbc](https://github.com/wooddance/crawlx/commit/d6fddbc))



### [1.4.6](https://github.com/wooddance/crawlx/compare/v1.4.1...v1.4.6) (2020-01-26)


### Bug Fixes

* change babel targets ([4c88a29](https://github.com/wooddance/crawlx/commit/4c88a29))
* change retry default behaviour ([6439f50](https://github.com/wooddance/crawlx/commit/6439f50))
* rename attempt symbols ([1aac175](https://github.com/wooddance/crawlx/commit/1aac175))
* unused var ([c69b839](https://github.com/wooddance/crawlx/commit/c69b839))


### Features

* basic priority queue ([678bfeb](https://github.com/wooddance/crawlx/commit/678bfeb))
* bull plugin ([9b2a07c](https://github.com/wooddance/crawlx/commit/9b2a07c))
* dupFilter plugin; work with resume plugin ([7f9497a](https://github.com/wooddance/crawlx/commit/7f9497a))


### refactor

* prepare new version ([90e6db9](https://github.com/wooddance/crawlx/commit/90e6db9))


### BREAKING CHANGES

* CommonJS import uses default; attempts instead of retry;



### [1.4.5](https://github.com/wooddance/crawlx/compare/v1.4.1...v1.4.5) (2020-01-25)


### Bug Fixes

* change retry default behaviour ([6439f50](https://github.com/wooddance/crawlx/commit/6439f50))


### Features

* basic priority queue ([9c02ba8](https://github.com/wooddance/crawlx/commit/9c02ba8))
* bull plugin ([9b2a07c](https://github.com/wooddance/crawlx/commit/9b2a07c))
* dupFilter plugin; work with resume plugin ([7f9497a](https://github.com/wooddance/crawlx/commit/7f9497a))



### [1.4.1](https://github.com/wooddance/crawlx/compare/v1.4.0...v1.4.1) (2020-01-20)



## [1.4.0](https://github.com/wooddance/crawlx/compare/v1.3.0...v1.4.0) (2020-01-20)


### Bug Fixes

* resolve for fail-spawned tasks ([dce32c8](https://github.com/wooddance/crawlx/commit/dce32c8))


### Features

* agent using got instead of axios ([b45ce3b](https://github.com/wooddance/crawlx/commit/b45ce3b))


### BREAKING CHANGES

* agent api changes with got instance



## [1.3.0](https://github.com/wooddance/crawlx/compare/v1.2.5...v1.3.0) (2020-01-14)


### Bug Fixes

* correct spawner mode ([4bcf161](https://github.com/wooddance/crawlx/commit/4bcf161))
* memory leak in resolvemap ([17d5593](https://github.com/wooddance/crawlx/commit/17d5593))
* parseCheck at first ([034d5b3](https://github.com/wooddance/crawlx/commit/034d5b3))
* plugin starts directly ([29c8ada](https://github.com/wooddance/crawlx/commit/29c8ada))


### Features

* date filter supports appending string ([e5b803c](https://github.com/wooddance/crawlx/commit/e5b803c))
* retry - defaultCallback again after custom cb ([57a52fe](https://github.com/wooddance/crawlx/commit/57a52fe))
* retry add callback ([19f2171](https://github.com/wooddance/crawlx/commit/19f2171))
* support follows ([5b4d0a9](https://github.com/wooddance/crawlx/commit/5b4d0a9))



### [1.2.5](https://github.com/wooddance/crawlx/compare/v1.2.4...v1.2.5) (2019-12-24)


### Bug Fixes

* filter trim check type ([74060b4](https://github.com/wooddance/crawlx/commit/74060b4))
* retry add task logic ([7f8a440](https://github.com/wooddance/crawlx/commit/7f8a440))
* retry drop by default ([2a5fd8f](https://github.com/wooddance/crawlx/commit/2a5fd8f))
* retry plugin check ([ad8a6fc](https://github.com/wooddance/crawlx/commit/ad8a6fc))


### Features

* http agent keep alive ([64a240b](https://github.com/wooddance/crawlx/commit/64a240b))
* parser catches errors and logs ([cf85708](https://github.com/wooddance/crawlx/commit/cf85708))
* retry plugin supports callback ([8a9ad41](https://github.com/wooddance/crawlx/commit/8a9ad41))



### [1.2.4](https://github.com/wooddance/crawlx/compare/v1.2.3...v1.2.4) (2019-12-07)


### Bug Fixes

* add instead of push & change follow callback ([cce13dd](https://github.com/wooddance/crawlx/commit/cce13dd))
* delete plugin redisQueue ([dd5583b](https://github.com/wooddance/crawlx/commit/dd5583b))
* package change ([42937e0](https://github.com/wooddance/crawlx/commit/42937e0))


### Features

* detached taskqueue ([dc44f85](https://github.com/wooddance/crawlx/commit/dc44f85))
* implement TaskQueue ([b70654f](https://github.com/wooddance/crawlx/commit/b70654f))
* redisQueue plugin ([61da935](https://github.com/wooddance/crawlx/commit/61da935))
* resume plugin ([a71b8ca](https://github.com/wooddance/crawlx/commit/a71b8ca))
* simplify x function ([16641df](https://github.com/wooddance/crawlx/commit/16641df))
* spawner mode ([b42ab61](https://github.com/wooddance/crawlx/commit/b42ab61))



### [1.2.3](https://github.com/wooddance/crawlx/compare/v1.2.2...v1.2.3) (2019-12-03)



### [1.2.2](https://github.com/wooddance/crawlx/compare/v1.2.1...v1.2.2) (2019-12-03)


### Bug Fixes

* change followRule ([7dd01e4](https://github.com/wooddance/crawlx/commit/7dd01e4))



### [1.2.1](https://github.com/wooddance/crawlx/compare/v1.2.0...v1.2.1) (2019-12-03)


### Bug Fixes

* remove config library ([dcd2a47](https://github.com/wooddance/crawlx/commit/dcd2a47))



## [1.2.0](https://github.com/wooddance/crawlx/compare/v1.1.3...v1.2.0) (2019-12-03)


### Bug Fixes

* absolute url fix ([e1848d2](https://github.com/wooddance/crawlx/commit/e1848d2))
* adjust priority for plugins ([771891e](https://github.com/wooddance/crawlx/commit/771891e))
* better error log ([146f357](https://github.com/wooddance/crawlx/commit/146f357))
* check url encoding ([1889208](https://github.com/wooddance/crawlx/commit/1889208))
* correct retrymerge ([906de2f](https://github.com/wooddance/crawlx/commit/906de2f))
* dropped task should be resolved ([8b6a69c](https://github.com/wooddance/crawlx/commit/8b6a69c))
* filter date,int,float ([ed68d46](https://github.com/wooddance/crawlx/commit/ed68d46))
* higher priority executed first ([07bdd8c](https://github.com/wooddance/crawlx/commit/07bdd8c))
* parseCheck ([5dabf1f](https://github.com/wooddance/crawlx/commit/5dabf1f))


### Features

* follow plugin ([fb06bbc](https://github.com/wooddance/crawlx/commit/fb06bbc))
* make use() async ([41705dc](https://github.com/wooddance/crawlx/commit/41705dc))
* parser first query accept function ([e6b3b19](https://github.com/wooddance/crawlx/commit/e6b3b19))
* seenReq plugin ([bcea280](https://github.com/wooddance/crawlx/commit/bcea280))
* use p-queue instead of async ([6d3214f](https://github.com/wooddance/crawlx/commit/6d3214f))



### [1.1.3](https://github.com/wooddance/crawlx/compare/v1.1.2...v1.1.3) (2019-11-21)


### Bug Fixes

* int, float accept defaultVal ([03de6cf](https://github.com/wooddance/crawlx/commit/03de6cf))
* retry options ([fb87062](https://github.com/wooddance/crawlx/commit/fb87062))
* revert exposed module api ([d947509](https://github.com/wooddance/crawlx/commit/d947509))



### [1.1.2](https://github.com/wooddance/crawlx/compare/v1.1.1...v1.1.2) (2019-11-21)


### Features

* support config method ([b2328bf](https://github.com/wooddance/crawlx/commit/b2328bf))



### [1.1.1](https://github.com/wooddance/crawlx/compare/v1.1.0...v1.1.1) (2019-11-21)


### Bug Fixes

* better divider & empty selector ([e22bcc2](https://github.com/wooddance/crawlx/commit/e22bcc2))
* use this instead of that in arrow fn ([9843da1](https://github.com/wooddance/crawlx/commit/9843da1))


### Features

* cheerio nextNode & outerHtml ([8f532c9](https://github.com/wooddance/crawlx/commit/8f532c9))
* expose x directly ([bd294ab](https://github.com/wooddance/crawlx/commit/bd294ab))
* pluginqueue ([b8cce30](https://github.com/wooddance/crawlx/commit/b8cce30))



## [1.1.0](https://github.com/wooddance/crawlx/compare/v1.0.0...v1.1.0) (2019-11-19)


### Bug Fixes

* error handling for x ([71bfc7a](https://github.com/wooddance/crawlx/commit/71bfc7a))


### Features

* parse support divider ([74502f3](https://github.com/wooddance/crawlx/commit/74502f3))
* plugin onError ([fbe7366](https://github.com/wooddance/crawlx/commit/fbe7366))
* use config module ([7f36cae](https://github.com/wooddance/crawlx/commit/7f36cae))



## [1.1.0](https://github.com/wooddance/crawlx/compare/v1.0.0...v1.1.0) (2019-11-19)


### Bug Fixes

* error handling for x ([71bfc7a](https://github.com/wooddance/crawlx/commit/71bfc7a))


### Features

* parse support divider ([74502f3](https://github.com/wooddance/crawlx/commit/74502f3))
* plugin onError ([fbe7366](https://github.com/wooddance/crawlx/commit/fbe7366))
* use config module ([7f36cae](https://github.com/wooddance/crawlx/commit/7f36cae))



## 1.0.0 (2019-11-15)


### Features

* crawler class ([9b6f3f9](https://github.com/wooddance/crawlx/commit/9b6f3f9))
* enhanced cheerio ([d5a6a4c](https://github.com/wooddance/crawlx/commit/d5a6a4c))
* lib entry ([8b0c92e](https://github.com/wooddance/crawlx/commit/8b0c92e))
* plugin: delay ([45d1934](https://github.com/wooddance/crawlx/commit/45d1934))
* plugin: parse ([c9bbe38](https://github.com/wooddance/crawlx/commit/c9bbe38))
* plugin: retry ([9f47276](https://github.com/wooddance/crawlx/commit/9f47276))
* PriorityQueue ([506101c](https://github.com/wooddance/crawlx/commit/506101c))
* sleep ([40e861d](https://github.com/wooddance/crawlx/commit/40e861d))
* superagent setup ([38ff2c5](https://github.com/wooddance/crawlx/commit/38ff2c5))
* use axios as agent ([98ea9b2](https://github.com/wooddance/crawlx/commit/98ea9b2))
