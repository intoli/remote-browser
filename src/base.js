export default class FeverDreamBase {
  constructor(options) {
    this.options = options;
  }

  end = async () => {
    // Works for Selenium driven clients.
    await this.driver.quit();
  };
}
