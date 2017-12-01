# Development


## Install Dependencies

```bash
yarn install
```

## Tests

You can compile and run all tests with

```bash
yarn test
```

The pre-compilation here is necessary because the extension needs to be packaged to run in the browsers.
If you only need to test the faster unit tests, then you can run

```bash
yarn test-fast
```

which will skip the compilation and exclude tests including "Browser" in their names.
These tests are run in parallel using both [mocha.parallel](https://github.com/danielstjules/mocha.parallel) and [mocha-parallel-tests](https://github.com/yandex/mocha-parallel-tests), so the entire suite should run quite quickly.
There's [a bug in `mocha-parallel-test`](https://github.com/yandex/mocha-parallel-tests/issues/84) that prevents it from working with the `--watch` option.
You can either use a general watcher, like [when-changed](https://github.com/joh/when-changed), to run `mocha-parallel-test`

```bash
when-changed -r src yarn test-fast
```

or use

```bash
yarn test-fast-mocha --watch
```

which will run the different test files serially with `mocha`.


## Live Reloading

Run

```bash
yarn watch
```

to create a build in `build/` that will automatically live-reload.
This directory should be loaded as an unpacked extension in a browser.
