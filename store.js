const storageKeys = {
  logs: 'logs',
  targets: 'targets',
  clientsCount: 'clientsCount',
  visitorsCount: 'visitorsCount',
};

class Store {
  client;

  constructor(client) {
    this.client = client;
  }

  async init() {
    await this.client.set(storageKeys.clientsCount, 0);
    await this.client.set(storageKeys.visitorsCount, 0);
    await this.client.set(storageKeys.targets);
    await this.client.set(storageKeys.logs, []);
  }

  async getClientsCount() {
    return parseInt(await this.client.get(storageKeys.clientsCount));
  }

  async getVisitorsCount() {
    return parseInt(await this.client.get(storageKeys.visitorsCount));
  }

  async incrementVisitors() {
    await this.client.set(storageKeys.visitorsCount, (await this.getVisitorsCount()) + 1);
  }

  async decrementVisitors() {
    await this.client.set(storageKeys.visitorsCount, (await this.getVisitorsCount()) - 1);
  }

  async incrementClients() {
    await this.client.set(storageKeys.clientsCount, (await this.getClientsCount()) + 1);
  }

  async decrementClients() {
    await this.client.set(storageKeys.clientsCount, (await this.getClientsCount()) - 1);
  }

  async getLogs() {
    return this.client.get(storageKeys.logs);
  }

  async updateTargets(data) {
    const urls = data.visitedUrls;
    const logs = await store.getLogs();
    const { maxLogsPacksLength } = config;

    if (logs.length <= maxLogsPacksLength) {
      await this.client.set(logs.concat(urls));
    } else {
      const updatedLogs = [...logs];
      updatedLogs.shift();
      updatedLogs.push(urls);
      await this.client.set(updatedLogs);
    }
    this.client.set(storageKeys.logs);
  }
}

module.exports = {
  Store,
  storageKeys
};
