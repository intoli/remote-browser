import chai from 'chai';

import { Client, Server } from '../src/connections';

describe('Connections', () => {
  it('should connect and echo', async () => {
    const server = new Server();
    const port = await server.listen();
    const client = new Client();
    await client.connect(port);

    const response = await server.send('hello', 'echo');
    chai.expect(response).to.equal('hello');
  });
});
