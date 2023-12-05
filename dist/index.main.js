"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const e=e=>"object"==typeof e&&null!==e,t=Symbol("NoValue"),r=e=>{let t=e,r=[];for(;t.p&&(r.push(t.k),t=t.p,!("op"in t)););return"op"in t?[t,r.reverse()]:null},o=(e,t)=>{var r;return e.c=null!==(r=e.c)&&void 0!==r?r:{},e.c[t]||(e.c[t]={p:e,k:t}),e.c[t]},n=(o,n,i,a)=>{var c;if(n===i)return;if("op"in o)return void(i===t?("new"in o&&delete o.new,Object.assign(o,{op:"remove"})):Object.assign(o,{new:i,op:"remove"===o.op?"replace":o.op}));const l=r(o);if(l){const[r,n]=l;if("new"in r){let s=r.new;n.pop(),n.forEach((t=>{if(!e(s))throw new Error(`We tried to merge two new values, but the new place at ${n.join(", ")} encountered a non object at first encounter of the key ${t}`);t in s&&(s=s[t])})),i===t?delete s[o.k.toString()]:s[o.k.toString()]=i}return}let u="replace";n===t&&(u="add"),i===t&&(u="remove"),Object.assign(o,{op:u,opCount:a,d:!0,...n!==t?{old:n}:{},...i!==t?{new:i}:{}}),o.c&&Object.values(null!==(c=o.c)&&void 0!==c?c:{}).forEach((e=>{s(e)}))},s=t=>{const{c:o}=t;if(Object.values(null!=o?o:{}).forEach((e=>{s(e)})),"old"in t){const o=r(t);if(!o)throw new Error("We tried to merge a subtree of mutation but there was no parent with an old value above: Not sure if error");const[n,s]=o;if(!("old"in n))throw new Error("We tried to merge a subtree of mutation but there was no parent with an old value above: Not sure if error");let i=n.old;s.pop(),s.forEach((t=>{if(!e(i))throw new Error(`We tried to merge two old values, but the new place at ${s.join(", ")} encountered a non object at first encounter of the key ${t}`);t in i&&(i=i[t])})),i[t.k.toString()]=t.old,"op"in t&&(delete t.op,delete t.new,delete t.old)}if("op"in t&&"add"===t.op){const o=r(t);if(!o)throw new Error("We tried to merge a subtree of mutation but there was no parent with an old value above: Not sure if error");const[n,s]=o;if("op"in n&&"remove"===n.op){let r=n.old;s.pop(),s.forEach((t=>{if(!e(r))throw new Error(`We tried to merge two old values, but the new place at ${s.join(", ")} encountered a non object at first encounter of the key ${t}`);t in r&&(r=r[t])})),delete r[t.k.toString()]}"op"in t&&(delete t.op,delete t.new,delete t.old)}"op"in t&&(delete t.op,delete t.new,delete t.old)},i=(e,t,r=[])=>{"op"in e?t.push({op:e.op,old:"old"in e?e.old:void 0,value:"new"in e?e.new:void 0,pathArray:r,opCount:e.opCount,path:`/${r.join("/")}`}):e.c&&Object.values(e.c).forEach((e=>{i(e,t,[...r,e.k])}))};const a=new class{constructor(){this.proxies=new WeakSet}cache(e){this.proxies.add(e)}exists(e){return this.proxies.has(e)}};Object.freeze(a);const c=(e,t,r,o)=>{var n,s,i;let a=e,c=[...t];for(;c.length;){const e=c.shift();a.children=null!==(n=a.children)&&void 0!==n?n:{},a.children[e]=null!==(s=a.children[e])&&void 0!==s?s:{propName:e},a=a.children[e]}return a.subs=null!==(i=a.subs)&&void 0!==i?i:[],r.options=o,a.subs.push(r),a},l=(e,t)=>{var r;if(!e.subs)return!1;const o=null===(r=e.subs)||void 0===r?void 0:r.indexOf(t);if(-1===o)return!1;e.subs=[...e.subs.slice(0,o),...e.subs.slice(o+1)]},u=(e,t)=>{const r="**"===e.propName;if(!e.children)return r?[e]:null;const o=[],n=e.children[t];return r&&o.push(e),n&&o.push(n),e.children["*"]&&o.push(e.children["*"]),e.children["**"]&&o.push(e.children["**"]),o.length?o:null},p=Symbol("Patcher"),h=Symbol("WatcherProxy"),d=Symbol("TargetRef"),y=(e,t)=>{const{op:r,pathArray:o,value:n}=e,s=o.length;if(!s)return;let i,a=t,c=a.hasOwnProperty(p)?{entity:a,pathArray:[...o]}:null;for(let e=0;e<s-1;e+=1){if(i=o[e],!a.hasOwnProperty(i))throw new Error(`applyJSONPatchOperation cannot walk json patch path ${o.join("/")}. Cannot access path ${[...o].slice(0,e).join("/")}.`);a=a[i],a.hasOwnProperty(p)&&(c={entity:a,pathArray:[...o].slice(e+1)})}const l=o[s-1];if(c&&"applyPatch"in c.entity&&"function"==typeof c.entity.applyPatch){const t=e.pathArray.filter((e=>-1!==(null==c?void 0:c.pathArray.indexOf(e)))),r=t.join("/");c.entity.applyPatch({...e,path:r,pathArray:t})}else switch(r){case"add":case"replace":Object.assign(a,{[l]:n});break;case"remove":delete a[l]}};class f{constructor(){this.mutationMaps=new Map,this.mutationDirtyPaths=new Map,this.mutationSelectorPointers=new Map,this.mutationChangePointers=new Map,this.getSubProxy=(e,t,r,o,n)=>{const s=this.mutationMaps.get(e);let i=null==s?void 0:s.get(o);return i||(i=new Proxy(o,new P({target:o,selectorPointerArray:r,mutationNode:t,dirtyPaths:this.mutationDirtyPaths.get(e),incOpCount:n,proxyfyAccess:(t,r,o)=>this.getSubProxy(e,r,o,t,n)})),null==s||s.set(o,i)),i}}startMutation(e){this.mutationMaps.set(e,new WeakMap);const t=new WeakMap,r=new Set,o=new Array(v.getSelectorTree(e)),n={p:null,k:""};this.mutationChangePointers.set(e,n);let s=0;const i=()=>(s+=1,s),a=new Proxy(e,new P({target:e,selectorPointerArray:o,mutationNode:n,dirtyPaths:r,incOpCount:i,proxyfyAccess:(t,r,o)=>this.getSubProxy(e,r,o,t,i)}));t.set(e,a),this.mutationDirtyPaths.set(e,r),this.mutationMaps.set(e,t),this.mutationSelectorPointers.set(e,o)}hasRoot(e){return this.mutationMaps.has(e)}commit(e){const t=this.mutationDirtyPaths.get(e);if(!t)return[];const r=Array.from(t).reduce(((e,t)=>(t.writeSelectorPointerArray.filter((e=>"root"!==e.propName)).forEach((t=>e.add(t))),e)),new Set),o=(e=>{const t=[];return i(e,t),t.sort(((e,t)=>e.opCount-t.opCount)).map((e=>{const{opCount:t,...r}=e;return r}))})(this.mutationChangePointers.get(e));return v.runSelectorPointers(e,r,o),this.mutationMaps.delete(e),this.mutationDirtyPaths.delete(e),o}mutate(e,t){var r;const o=!this.hasRoot(e);o&&this.startMutation(e);const n=null===(r=this.mutationMaps.get(e))||void 0===r?void 0:r.get(e);if(n)return t(n),o?this.commit(e):[]}}const w=new f,g=(e,t)=>w.mutate(e,t),m=(t,r,o,n,s)=>new Proxy(t,{get:(i,a)=>{if("symbol"==typeof a&&a===h)return!0;if("symbol"==typeof a||"hasOwnProperty"===a)return Reflect.get(i,a);const l=Object.getOwnPropertyDescriptor(i.constructor.prototype,a);if(null==l?void 0:l.get)return l.get.call(m(t,r,o,n,s));{const t=i[a];return n.push(c(o,[...r,a],s)),e(t)?m(t,[...r,a],o,n,s):t}},getOwnPropertyDescriptor:(e,t)=>t===h?{configurable:!0,value:!0}:Reflect.getOwnPropertyDescriptor(e,t),ownKeys:e=>(n.push(c(o,[...r,"*"],s)),Reflect.ownKeys(e))});class P{constructor(e){this.deleted={},this.original={},this.writeSelectorPointerArray=[];const{target:t,proxyfyAccess:r,dirtyPaths:o}=e;this.targetRef=t,this.proxyfyAccess=r,this.dirtyPaths=o,this.selectorPointerArray=e.selectorPointerArray,this.mutationNode=e.mutationNode,this.incOpCount=e.incOpCount}get(e,t){if("symbol"==typeof t&&t===d)return this.targetRef;if("symbol"==typeof t&&t===h)return!0;if("symbol"==typeof t||"hasOwnProperty"===t)return Reflect.get(e,t);if("string"==typeof t&&this.deleted.hasOwnProperty(t))return;const r=e[t];if("object"==typeof r&&null!==r){if(a.exists(r))return r;const{selectorPointerArray:e}=this,n=e.reduce(((e,r)=>{const o=u(r,t);return o&&e.push(...o),e}),[]),s=o(this.mutationNode,t),i=this.proxyfyAccess(r,s,n);return a.exists(i)||a.cache(i),i}return r}set(e,r,s){if("length"===r&&Array.isArray(e))return!0;this.writeSelectorPointerArray.push(...this.selectorPointerArray.reduce(((e,t)=>{const o=u(t,r);return o&&e.push(...o),e}),[])),this.dirtyPaths.add(this),!this.original.hasOwnProperty(r)&&e.hasOwnProperty(r)&&(this.original[r]=e[r]);let i=s;if("object"==typeof s&&null!==s){const e=s;i=e.hasOwnProperty(h)?e[d]:Array.isArray(s)?[...s]:{...s}}let a=this.original[r];"object"==typeof a&&null!==a&&(a={...a});const c=o(this.mutationNode,r);return n(c,r in e?e[r]:t,i,this.incOpCount()),Reflect.set(e,r,s)}deleteProperty(e,r){if(r in e&&"string"==typeof r){this.writeSelectorPointerArray.push(...this.selectorPointerArray.reduce(((e,t)=>{const o=u(t,r);return o&&e.push(...o),e}),[]));const s=o(this.mutationNode,r);n(s,e[r],t,this.incOpCount()),this.dirtyPaths.add(this),this.deleted[r]=!0,this.original.hasOwnProperty(r)||(this.original[r]=e[r]);let i=this.original[r];"object"==typeof i&&null!==i&&(i={...i})}return Reflect.deleteProperty(e,r)}getOwnPropertyDescriptor(e,t){if("string"!=typeof t||!this.deleted[t])return t===h?{configurable:!0,value:!0}:Reflect.getOwnPropertyDescriptor(e,t)}ownKeys(e){return Reflect.ownKeys(e)}has(e,t){return Reflect.has(e,t)}}class b{constructor(){this.selectorTrees=new WeakMap}getSelectorTree(e){if(!this.selectorTrees.has(e)){const t={propName:"root"};return this.selectorTrees.set(e,t),t}return this.selectorTrees.get(e)}runSelectorPointers(e,t,r){const o=new Set,n=o.add.bind(o),s=(e,t=!1)=>{e.forEach((e=>{const{subs:r,children:o}=e;t?null==r||r.forEach(n):null==r||r.filter((e=>{var t;return null===(t=e.options)||void 0===t?void 0:t.reactToAncestorChanges})).forEach(n),o&&s(Object.values(o))}))};s(t,!0),o.forEach((t=>{t(e,r)}))}}const v=new b;exports.IObservableDomain=class{},exports.LIB_VERSION="2.0.5beta",exports.MutationsManager=f,exports.Patcher=p,exports.ProxyMutationObjectHandler=P,exports.StateTreeSelectorsManager=b,exports.TargetRef=d,exports.WatcherProxy=h,exports.applyJSONPatchOperation=y,exports.autorun=(e,t)=>{const r=v.getSelectorTree(e);let o=[];const n=()=>{o.forEach((e=>{l(e,s)}))},s=(i,a)=>{n(),o=[];const c=m(e,[],r,o,s);t(c,a)};return s(),n},exports.inversePatch=e=>{const{path:t,pathArray:r,op:o,value:n,old:s}=e;switch(o){case"add":return{op:"remove",value:s,old:n,pathArray:r,path:t};case"remove":return{op:"add",value:s,old:n,pathArray:r,path:t};case"replace":return{op:"replace",value:s,old:n,pathArray:r,path:t}}},exports.mutate=g,exports.mutateFromPatches=(e,t)=>{g(e,(e=>{for(let r=0;r<t.length;r+=1)y(t[r],e)}))},exports.select=(e,t,r,o)=>{const n=v.getSelectorTree(e),s=new Set,i=(...e)=>{const t=r(...e);return s.forEach((e=>e(t))),t},a=t.map((e=>c(n,(e=>e.startsWith("/")?e.substring(1).split("/"):e.split("/"))(e),i,o)));return{reshape:()=>{throw new Error("reshape is no longer supported")},observe:e=>(console.warn("observe is depreacated. Use just selectors or autorun instead"),s.add(e),()=>{s.delete(e)}),dispose:()=>{for(const e of a)l(e,i)}}},exports.selectorsManager=v;
