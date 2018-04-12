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

<p align="left">
    <a href="https://circleci.com/gh/intoli/remote-browser/tree/master">
        <img src="https://img.shields.io/circleci/project/github/intoli/remote-browser/master.svg"
            alt="Build Status"></a>
    <a href="https://github.com/intoli/remote-browser/blob/master/LICENSE">
        <img src="https://img.shields.io/badge/License-BSD%202--Clause-blue.svg"
            alt="License"></a>
    <a href="https://www.npmjs.com/package/remote-browser">
        <img src="https://img.shields.io/npm/v/remote-browser.svg"
            alt="NPM Version"></a>
</p>


Remote-Browser is a library for controlling web browsers like Chrome and Firefox programmatically using JavaScript.
You've likely heard of similar browser automation frameworks before, such as [Puppeteer](https://github.com/GoogleChrome/puppeteer) and [Selenium](https://github.com/SeleniumHQ/selenium).
Much like these other projects, Remote-Browser can be used to accomplish a wide variety of tasks relating to UI testing, Server Side Rendering (SSR), and web scraping.
What makes Remote-Browser different from these other libraries is that it's built using standard browser APIs, and its primary purpose is facilitating interactions with these existing APIs.


## Table of Contents

- [Installation](#installation) - Instructions for installing Remote-Browser.
- [Development](#development) - Instructions for setting up the development environment.
- [Contributing](#contributing) - Guidelines for contributing.
- [License](#license) - License details for the project.


## Installation

Remote-Browser is available as an [npm package](https://www.npmjs.com/package/remote-browser), and the latest version can be installed by running the following.

```bash
yarn add remote-browser
```

It's possible to use Remote-Browser as a client for browser sessions on remote servers, but you'll almost certainly want a local browser installed when you're first getting started.
We recommend [installing Firefox](https://www.mozilla.org/firefox), even if it's not your day-to-day browser, because it has a more complete implementation of the Web Extensions API than other browsers.
It's additionally set as the default in Remote-Browser, so it will allow you to run the usage examples without changing any of the configuration options.


## Development

To get started on development, you simply need to clone the repository and install the project dependencies.

```bash
# Clone the repository.
git clone git@github.com:intoli/remote-browser.git
cd remote-browser

# Install the dependencies.
yarn install

# Build the project.
yarn build

# Run the tests.
yarn test
```

## Contributing

Contributions are welcome, but please follow these contributor guidelines:

- Create an issue on [the issue tracker](https://github.com/intoli/remote-browser/issues/new) to discuss potential changes before submitting a pull request.
- Include at least one test to cover any new functionality or bug fixes.
- Make sure that all of your tests are passing and that there are no merge conflicts.


# License

Remote-Browser is licensed under a [BSD 2-Clause License](LICENSE.md) and is copyright [Intoli, LLC](https://intoli.com).
