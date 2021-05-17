class ProxyCache {
  private proxies = new WeakSet()

  cache(proxie: object) {
    this.proxies.add(proxie)
  }

  exists(proxie: object) {
    return this.proxies.has(proxie)
  }
}

const cache = new ProxyCache()
Object.freeze(cache)
export { cache as ProxyCache }