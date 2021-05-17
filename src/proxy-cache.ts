class ProxyCache<T extends object> {
  private proxies = new WeakSet<T>()

  cache(proxie: T) {
    this.proxies.add(proxie)
  }

  exists(proxie: T) {
    return this.proxies.has(proxie)
  }
}

const cache = new ProxyCache()
Object.freeze(cache)
export { cache as ProxyCache }