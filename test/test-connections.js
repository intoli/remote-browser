import assert from 'assert';

import { Client, ConnectionProxy, Server } from '../src/connections';
import { TimeoutError } from '../src/errors';


const createConnection = async () => {
  const server = new Server();
  const port = await server.listen();
  const client = new Client();
  await client.connect(port);

  return { client, port, server };
};


const createProxiedConnection = async (sessionId = 'default') => {
  const proxy = new ConnectionProxy();
  const port = await proxy.listen();
  const clients = [new Client(), new Client()]
  const url = `http://localhost:${port}/`;
  await clients[0].connect(url, 'user', sessionId);
  await clients[1].connect(url, 'extension', sessionId);

  return { clients, proxy };
};


describe('Connections', () => {
  it('should handle pings from the client', async () => {
    const { client } = await createConnection();
    assert.equal(await client.ping(), 'pong');
  });

  it('should handle pings from the server', async () => {
    const { client } = await createConnection();
    assert.equal(await client.ping(), 'pong');
  });

  it('should echo messages from the client', async () => {
    const { client, server } = await createConnection();
    const sent = 'hello';
    server.subscribe(async (echoed) => echoed);
    const received = await client.send(sent);
    assert.equal(sent, received);
  });

  it('should handle multiple channels', async () => {
    const channelCount = 5;
    const messageCount = 100;

    const { client, server } = await createConnection();

    const channels = [];
    for (let i = 0; i < channelCount; i++) {
      const channel = `channel-${i}`;
      server.subscribe(async (data) => ({ channel, data }), { channel });
      channels.push(channel);
    }

    let i = 0;
    const expectedMessages = [];
    const promises = []
    for (let i = 0; i < messageCount; i++) {
      const channel = channels[i % channelCount];
      expectedMessages.push({ channel, data: i });
      promises.push(client.send(i, { channel }));
    }
    const messages = await Promise.all(promises);

    assert.deepEqual(messages, expectedMessages);
  });

  it('should raise a timeout error waiting for a response', async () => {
    const { client, server } = await createConnection();

    server.subscribe(async () => new Promise(() => {}));
    let error;
    try {
      await client.send(null, { timeout: 10 });
    } catch (e) {
      error = e;
    }
    assert(error instanceof TimeoutError);
  });
});


describe('Proxied Connections', async () => {
  it('should echo messages between clients', async () => {
    const { clients } = await createProxiedConnection();
    const sent = 'hello';
    clients[1].subscribe(async (echoed) => echoed);
    const received = await clients[0].send(sent);
    assert.equal(sent, received);
  });

  it('should handle pings from both clients', async () => {
    const { clients } = await createProxiedConnection();

    assert.equal(await clients[0].ping(), 'pong');
    assert.equal(await clients[1].ping(), 'pong');
  });
});
