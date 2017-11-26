export default class FeverDreamBase {
  constructor(options) {
    this.options = options;
  }

  end = async () => {
    await this.server.close();

    // Works for Selenium driven clients.
    await this.driver.quit();
  };
}
