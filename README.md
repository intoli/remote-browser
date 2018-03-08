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
To run the tests in parallel you can run the following.

```bash
yarn test -- --watch
```



## Live Reloading

Run

```bash
yarn watch
```

to create a build in `dist/` that will automatically live-reload.
The `dist/extension` subdirectory can be loaded as an unpacked extension in a browser.
