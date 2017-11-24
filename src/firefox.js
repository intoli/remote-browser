import Marionette from 'marionette-client';

import FeverDreamBase from './base';


export default class FeverDreamFirefox extends FeverDreamBase {
  initialize = async url => new Promise((resolve, revoke) => {
    const driver = new Marionette.Drivers.Tcp({});
    driver.connect((connectionError) => {
      if (connectionError) {
        revoke(connectionError);
        return;
      }
      const client = new Marionette.Client(driver);
      client.startSession((startError) => {
        if (startError) {
          revoke(startError);
          return;
        }
        client.goUrl(url, (goError) => {
          if (goError) {
            revoke(goError);
            return;
          }
          resolve(client);
        });
      });
    });
  });
}
