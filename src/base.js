import path from 'path';

import { Server } from './connections';


export default class FeverDreamBase {
  constructor(options) {
    this.options = options;
  }

  initialize = async () => {
    const extension = path.resolve(__dirname, 'extension');
    return new Promise(async (resolve) => {
      this.server = new Server();
      this.server.once('connection', resolve);
      this.port = await this.server.listen();
      const url = `file:///?feverDreamPort=${this.port}`;

      await this.initializeDriver(url, extension);
    });
  };

  end = async () => {
    // Works for Selenium driven clients.
    await this.driver.quit();

    // Do this after so the connection breaks.
    await this.server.close();
  };

  evaluateInBackground = async asyncFunction => (
    this.server.send(asyncFunction.toString(), { channel: 'evaluateInBackground' })
  );
}
