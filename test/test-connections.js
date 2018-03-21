import assert from 'assert';

import { Client, ConnectionProxy, Server } from '../src/connections';
import { TimeoutError } from '../src/errors';


const createProxiedConnection = async (sessionId = 'default') => {
  const proxy = new ConnectionProxy();
  const port = await proxy.listen();
  const clients = [new Client(), new Client()]
  const url = `http://localhost:${port}/`;
  await clients[0].connect(url, 'user', sessionId);
  await clients[1].connect(url, 'extension', sessionId);

  return { clients, proxy };
};


describe('Proxied Connections', async () => {
  it('should echo messages between clients', async () => {
    const { clients } = await createProxiedConnection();
    const sent = 'hello';
    clients[1].subscribe(async (echoed) => echoed);
    let received = await clients[0].send(sent);
    assert.equal(sent, received);
    clients[0].subscribe(async (echoed) => echoed);
    received = await clients[1].send(sent);
    assert.equal(sent, received);
  });

  it('should handle pings from both clients', async () => {
    const { clients } = await createProxiedConnection();

    assert.equal(await clients[0].ping(), 'pong');
    assert.equal(await clients[1].ping(), 'pong');
  });

  it('should handle multiple channels', async () => {
    const channelCount = 5;
    const messageCount = 100;

    const { clients } = await createProxiedConnection();

    const channels = [];
    for (let i = 0; i < channelCount; i++) {
      const channel = `channel-${i}`;
      clients[0].subscribe(async (data) => ({ channel, data }), { channel });
      channels.push(channel);
    }

    let i = 0;
    const expectedMessages = [];
    const promises = []
    for (let i = 0; i < messageCount; i++) {
      const channel = channels[i % channelCount];
      expectedMessages.push({ channel, data: i });
      promises.push(clients[1].send(i, { channel }));
    }
    const messages = await Promise.all(promises);

    assert.deepEqual(messages, expectedMessages);
  });

  it('should raise a timeout error waiting for a response', async () => {
    const { clients } = await createProxiedConnection();

    clients[0].subscribe(async () => new Promise(() => {}));
    let error;
    try {
      await clients[1].send(null, { timeout: 10 });
    } catch (e) {
      error = e;
    }
    assert(error instanceof TimeoutError);
  });
});
