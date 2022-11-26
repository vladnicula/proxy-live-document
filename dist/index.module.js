const t=new class{constructor(){this.proxies=new WeakSet}cache(t){this.proxies.add(t)}exists(t){return this.proxies.has(t)}};Object.freeze(t);const e=(t,e,r)=>{var s,o,n;let a=t,i=[...e];for(;i.length;){const t=i.shift();a.children=null!==(s=a.children)&&void 0!==s?s:{},a.children[t]=null!==(o=a.children[t])&&void 0!==o?o:{propName:t},a=a.children[t]}return a.subs=null!==(n=a.subs)&&void 0!==n?n:[],a.subs.push(r),a},r=(t,e)=>{var r;if(!t.subs)return!1;const s=null===(r=t.subs)||void 0===r?void 0:r.indexOf(e);if(-1===s)return!1;t.subs=[...t.subs.slice(0,s),...t.subs.slice(s+1)]},s=(t,e)=>{const r="**"===t.propName;if(!t.children)return r?[t]:null;const s=[],o=t.children[e];return r&&s.push(t),o&&s.push(o),t.children["*"]&&s.push(t.children["*"]),t.children["**"]&&s.push(t.children["**"]),s.length?s:null},o=Symbol("Patcher"),n=Symbol("WatcherProxy"),a=Symbol("TargetRef"),i=t=>{const e=new Map;for(let r=0;r<t.length;r+=1){const s=t[r];if(!e.has(s))for(let r=0;r<t.length;r+=1){const o=t[r];s===o||e.has(o)||o.path.includes(s.path)&&h(s,o)&&e.set(o,!0)}}return t.filter((t=>!e.has(t)))},h=(t,e)=>{const r=t.path;if(!e.path.includes(r))return!1;switch(t.op){case"remove":return"add"===e.op&&(t.op="replace",t.value=e.value),!0;case"add":return l(t,e),!0;case"replace":return!0;default:return!1}},l=(t,e)=>{const r=t.value,s=e.path.replace(t.path,""),o=s.split("/").filter((t=>!!t));c({...e,path:s,pathArray:o},r)},c=(t,e)=>{const{op:r,pathArray:s,value:n}=t,a=s.length;if(!a)return;let i,h=e,l=h.hasOwnProperty(o)?{entity:h,pathArray:[...s]}:null;for(let t=0;t<a-1;t+=1){if(i=s[t],!h.hasOwnProperty(i))throw new Error(`applyJSONPatchOperation cannot walk json patch path ${s.join("/")}. Cannot access path ${[...s].slice(0,t).join("/")}.`);h=h[i],h.hasOwnProperty(o)&&(l={entity:h,pathArray:[...s].slice(t+1)})}const c=s[a-1];if(l&&"applyPatch"in l.entity&&"function"==typeof l.entity.applyPatch){const e=t.pathArray.filter((t=>-1!==(null==l?void 0:l.pathArray.indexOf(t)))),r=e.join("/");l.entity.applyPatch({...t,path:r,pathArray:e})}else switch(r){case"add":case"replace":Object.assign(h,{[c]:n});break;case"remove":delete h[c]}},p=(t,e)=>{d(t,(t=>{for(let r=0;r<e.length;r+=1)c(e[r],t)}))};class u{constructor(){this.mutationMaps=new Map,this.mutationDirtyPaths=new Map,this.mutationSelectorPointers=new Map,this.getSubProxy=(t,e,r,s)=>{const o=this.mutationMaps.get(t);let n=null==o?void 0:o.get(r);return n||(n=new Proxy(r,new w({target:r,selectorPointerArray:e,dirtyPaths:this.mutationDirtyPaths.get(t),pathArray:s,proxyfyAccess:(e,r,s)=>this.getSubProxy(t,r,e,s)})),null==o||o.set(r,n)),n}}startMutation(t){this.mutationMaps.set(t,new WeakMap);const e=new WeakMap,r=new Set,s=new Array(v.getSelectorTree(t)),o=new Proxy(t,new w({target:t,selectorPointerArray:s,dirtyPaths:r,proxyfyAccess:(e,r,s)=>this.getSubProxy(t,r,e,s)}));e.set(t,o),this.mutationDirtyPaths.set(t,r),this.mutationMaps.set(t,e),this.mutationSelectorPointers.set(t,s)}hasRoot(t){return this.mutationMaps.has(t)}commit(t){const e=this.mutationDirtyPaths.get(t);if(!e)return[];const r=Array.from(e).reduce(((t,e)=>{const{writeSelectorPointerArray:r}=e;return t.push(...r),t}),[]),s=[...new Set(r)].filter((t=>"root"!==t.propName)),o=Array.from(e).reduce(((t,e)=>{const{pathArray:r,ops:s}=e,o=r.length?`/${r.join("/")}`:"";for(let e=0;e<s.length;e+=1){const n=s[e],{old:a,value:i}=n;a!==i&&t.push({...n,path:`${o}/${n.path}`,pathArray:[...r,n.path]})}return t}),[]),n=i(o);return v.runSelectorPointers(t,s,n),this.mutationMaps.delete(t),this.mutationDirtyPaths.delete(t),n}mutate(t,e){var r;const s=!this.hasRoot(t);s&&this.startMutation(t);const o=null===(r=this.mutationMaps.get(t))||void 0===r?void 0:r.get(t);if(o)return e(o),s?this.commit(t):[]}}const y=new u,d=(t,e)=>y.mutate(t,e),f=(t,r,s,o,a)=>new Proxy(t,{get:(i,h)=>{if("symbol"==typeof h&&h===n)return!0;if("symbol"==typeof h||"hasOwnProperty"===h)return Reflect.get(i,h);const l=Object.getOwnPropertyDescriptor(i.constructor.prototype,h);if(null==l?void 0:l.get)return l.get.call(f(t,r,s,o,a));{const t=i[h];return o.push(e(s,[...r,h],a)),"object"==typeof(c=t)&&null!==c?f(t,[...r,h],s,o,a):t}var c},getOwnPropertyDescriptor:(t,e)=>e===n?{configurable:!0,value:!0}:Reflect.getOwnPropertyDescriptor(t,e)}),g=(t,e)=>{const s=v.getSelectorTree(t);let o=[];const n=()=>{o.forEach((t=>{r(t,a)}))},a=(r,i)=>{n(),o=[];const h=f(t,[],s,o,a);e(h,i)};return a(),n};class P{}class w{constructor(t){this.deleted={},this.original={},this.ops=[],this.writeSelectorPointerArray=[];const{target:e,pathArray:r=[],proxyfyAccess:s,dirtyPaths:o}=t;this.pathArray=r,this.targetRef=e,this.proxyfyAccess=s,this.dirtyPaths=o,this.selectorPointerArray=t.selectorPointerArray}get(e,r){if("symbol"==typeof r&&r===a)return this.targetRef;if("symbol"==typeof r&&r===n)return!0;if("symbol"==typeof r||"hasOwnProperty"===r)return Reflect.get(e,r);if("string"==typeof r&&this.deleted.hasOwnProperty(r))return;const o=e[r];if("object"==typeof o&&null!==o){if(t.exists(o))return o;const{selectorPointerArray:e}=this,n=e.reduce(((t,e)=>{const o=s(e,r);return o&&t.push(...o),t}),[]),a=this.proxyfyAccess(o,n,[...this.pathArray,r]);return t.exists(a)||t.cache(a),a}return o}set(t,e,r){this.writeSelectorPointerArray.push(...this.selectorPointerArray.reduce(((t,r)=>{const o=s(r,e);return o&&t.push(...o),t}),[])),this.dirtyPaths.add(this);let o="add";t[e]&&(o=r?"replace":"remove"),!this.original.hasOwnProperty(e)&&t.hasOwnProperty(e)&&(this.original[e]=t[e]);let i=r;if("object"==typeof r&&null!==r){const t=r;i=t.hasOwnProperty(n)?t[a]:{...r}}let h=this.original[e];return"object"==typeof h&&null!==h&&(h={...h}),this.ops.push({op:o,path:String(e),old:h,value:i}),Reflect.set(t,e,r)}deleteProperty(t,e){if(e in t&&"string"==typeof e){this.writeSelectorPointerArray.push(...this.selectorPointerArray.reduce(((t,r)=>{const o=s(r,e);return o&&t.push(...o),t}),[])),this.dirtyPaths.add(this),this.deleted[e]=!0,this.original.hasOwnProperty(e)||(this.original[e]=t[e]);let r=this.original[e];"object"==typeof r&&null!==r&&(r={...r}),this.ops.push({op:"remove",path:`${e}`,old:r,value:void 0})}return Reflect.deleteProperty(t,e)}getOwnPropertyDescriptor(t,e){if("string"!=typeof e||!this.deleted[e])return e===n?{configurable:!0,value:!0}:Reflect.getOwnPropertyDescriptor(t,e)}ownKeys(t){return Reflect.ownKeys(t)}has(t,e){return Reflect.has(t,e)}}const m=(t,e)=>{if(-1===t.indexOf("**")&&t.length!==e.length)return!1;for(let r=0;r<t.length;r+=1)if(t[r]!==e[r]&&("*"!==t[r]||!e[r])){if(r+1===t.length&&"**"===t[r]&&e[r])return!0;if(e[r]!==t[r])return!1}return!0};const v=new class{constructor(){this.selectorTrees=new WeakMap}getSelectorTree(t){if(!this.selectorTrees.has(t)){const e={propName:"root"};return this.selectorTrees.set(t,e),e}return this.selectorTrees.get(t)}runSelectorPointers(t,e,r){const s=new Set,o=e=>{s.has(e)||(s.add(e),e(t,r))},n=t=>{t.forEach((t=>{const{subs:e,children:r}=t;null==e||e.forEach(o),r&&n(Object.values(r))}))};n(e)}},A=(t,s,o)=>{const n=v.getSelectorTree(t),a=new Set,i=(...t)=>{const e=o(...t);a.forEach((t=>t(e)))},h=s.map((t=>e(n,(t=>t.startsWith("/")?t.substring(1).split("/"):t.split("/"))(t),i)));return{reshape:()=>{throw new Error("Reshape method is no longer supported")},observe:t=>(a.add(t),()=>{a.delete(t)}),dispose:()=>{for(const t of h)r(t,o)}}},b=t=>{const{path:e,pathArray:r,op:s,value:o,old:n}=t;switch(s){case"add":return{op:"remove",value:n,old:o,pathArray:r,path:e};case"remove":return{op:"add",value:n,old:o,pathArray:r,path:e};case"replace":return{op:"replace",value:n,old:o,pathArray:r,path:e}}};export{P as IObservableDomain,u as MutationsManager,o as Patcher,w as ProxyMutationObjectHandler,a as TargetRef,n as WatcherProxy,c as applyJSONPatchOperation,g as autorun,i as combinedJSONPatches,b as inversePatch,d as mutate,p as mutateFromPatches,m as pathMatchesSource,A as select,v as selectorsManager};
