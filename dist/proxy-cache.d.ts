declare class ProxyCache<T extends object> {
    private proxies;
    cache(proxie: T): void;
    exists(proxie: T): boolean;
}
declare const cache: ProxyCache<object>;
export { cache as ProxyCache };
