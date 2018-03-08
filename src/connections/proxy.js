import Server from './server';


export default class Proxy {
  constructor() {
    this.servers = [
      new Server(),
      new Server(),
    ];
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
