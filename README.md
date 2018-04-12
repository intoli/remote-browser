<h1 vertical-align="middle">Remote-Browser
    <a targe="_blank" href="https://twitter.com/home?status=Remote-Browser%20%E2%80%93%20A%20browser%20automation%20framework%20based%20on%20the%20Web%20Extensions%20API.%20%40IntoliNow%0A%0Ahttps%3A//github.com/intoli/remote-browser">
        <img height="26px" src="https://simplesharebuttons.com/images/somacro/twitter.png"
            alt="Tweet"></a>
    <a target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=https%3A//github.com/intoli/remote-browser">
        <img height="26px" src="https://simplesharebuttons.com/images/somacro/facebook.png"
            alt="Share on Facebook"></a>
    <a target="_blank" href="http://reddit.com/submit?url=https%3A%2F%2Fgithub.com%2Fintoli%2Fremote-browser&title=Remote-Browser%20%E2%80%93%20A%20browser%20automation%20framework%20based%20on%20the%20Web%20Extensions%20API.">
        <img height="26px" src="https://simplesharebuttons.com/images/somacro/reddit.png"
            alt="Share on Reddit"></a>
    <a target="_blank" href="https://news.ycombinator.com/submitlink?u=https://github.com/intoli/remote-browser&t=Remote-Browser%20%E2%80%93%20A%20browser%20automation%20framework%20based%20on%20the%20Web%20Extensions%20API.">
        <img height="26px" src="media/ycombinator.png"
            alt="Share on Hacker News"></a>
</h1>


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
