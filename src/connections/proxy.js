import Server from './server';


export default class Proxy {
  constructor() {
    this.servers = [0, 1].map((i) => {
      const server = new Server();
      server.onData = (data) => {
        this.servers[(i + 1) % 2].ws.send(data);
      };
      return server;
    });
  }

  close = async () => {
    await this.servers[0].close();
    await this.servers[1].close();
  };

  listen = async () => {
    // This is done sequentially for now to avoid port conflicts.
    this.ports = [await this.servers[0].listen()];
    this.ports.push(await this.servers[1].listen());
    return this.ports;
  };
}
