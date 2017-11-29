import chai from 'chai';
import parallel from 'mocha.parallel';

import { Client, Server } from '../src/connections';

const createConnection = async () => {
  const server = new Server();
  const port = await server.listen();
  const client = new Client();
  await client.connect(port);

  return { client, port, server };
};

parallel('Connections', () => {
  it('should handle pings from the client', async () => {
    const { client } = await createConnection();
    chai.expect(await client.ping()).to.equal('pong');
  });

  it('should handle pings from the server', async () => {
    const { client } = await createConnection();
    chai.expect(await client.ping()).to.equal('pong');
  });

  it('should echo messages from the client', async () => {
    const { client, server } = await createConnection();
    const sent = 'hello';
    server.subscribe(async (echoed) => echoed);
    const received = await client.send(sent);
    chai.expect(sent).to.equal(received);
  });
});
