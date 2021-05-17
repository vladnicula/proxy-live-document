"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const t=new class{constructor(){this.proxies=new WeakSet}cache(t){this.proxies.add(t)}exists(t){return this.proxies.has(t)}};Object.freeze(t);const e=Symbol("Patcher"),r=Symbol("WatcherProxy"),s=Symbol("TargetRef"),a=t=>{const e=new Map;for(let r=0;r<t.length;r+=1){const s=t[r];if(!e.has(s))for(let a=0;a<t.length;a+=1){const n=t[a];s===n||e.has(n)||n.path.includes(s.path)&&o(s,n,r<a)&&e.set(n,!0)}}return t.filter(t=>!e.has(t))},o=(t,e,r)=>{const s=t.path,a=e.path;if(!a.includes(s))return!1;switch(t.op){case"remove":return!(s===a&&r);case"add":return n(t,e),!0;case"replace":return!0;default:return!1}},n=(t,e)=>{const r=t.value,s=e.path.replace(t.path,"");if(""===s&&(!isNaN(t.value)||"string"==typeof t.value))return void(t.value=e.value);const a=s.split("/").filter(t=>!!t);i({...e,path:s,pathArray:a},r)},i=(t,r)=>{const{op:s,pathArray:a,value:o}=t,n=a.length;if(!n)return;let i,l=r,c=l.hasOwnProperty(e)?{entity:l,pathArray:[...a]}:null;for(let t=0;t<n-1;t+=1){if(i=a[t],!l.hasOwnProperty(i))throw new Error(`applyJSONPatchOperation cannot walk json patch path ${a.join("/")}. Cannot access path ${[...a].slice(0,t).join("/")}.`);l=l[i],l.hasOwnProperty(e)&&(c={entity:l,pathArray:[...a].slice(t+1)})}const h=a[n-1];if(c&&"applyPatch"in c.entity&&"function"==typeof c.entity.applyPatch){const e=t.pathArray.filter(t=>-1!==(null==c?void 0:c.pathArray.indexOf(t))),r=e.join("/");c.entity.applyPatch({...t,path:r,pathArray:e})}else switch(s){case"add":case"replace":Object.assign(l,{[h]:o});break;case"remove":delete l[h]}};class l{constructor(){this.mutationMaps=new Map,this.mutationDirtyPaths=new Map,this.getSubProxy=(t,e,r)=>{const s=this.mutationMaps.get(t);let a=null==s?void 0:s.get(e);return a||(a=new Proxy(e,new p({target:e,dirtyPaths:this.mutationDirtyPaths.get(t),pathArray:r,proxyfyAccess:(e,r)=>this.getSubProxy(t,e,r)})),null==s||s.set(e,a)),a}}startMutation(t){var e;this.mutationMaps.set(t,new WeakMap),this.mutationDirtyPaths.set(t,new Set);const r=new Proxy(t,new p({target:t,dirtyPaths:this.mutationDirtyPaths.get(t),proxyfyAccess:(e,r)=>this.getSubProxy(t,e,r)}));null===(e=this.mutationMaps.get(t))||void 0===e||e.set(t,r)}hasRoot(t){return this.mutationMaps.has(t)}commit(t){const e=this.mutationDirtyPaths.get(t);if(!e)return[];const r=Array.from(e).reduce((t,e)=>{const{pathArray:r,ops:s}=e,a=r.length?"/"+r.join("/"):"";for(let e=0;e<s.length;e+=1){const o=s[e],{old:n,value:i}=o;n!==i&&t.push({...o,path:`${a}/${o.path}`,pathArray:[...r,o.path]})}return t},[]).sort((t,e)=>(t.patchNumber||0)-(e.patchNumber||0)),s=a(r);return d.processPatches(t,s),this.mutationMaps.delete(t),this.mutationDirtyPaths.delete(t),s}mutate(t,e){var r;const s=!this.hasRoot(t);s&&this.startMutation(t);const a=null===(r=this.mutationMaps.get(t))||void 0===r?void 0:r.get(t);if(a)return e(a),s?this.commit(t):[]}}const c=new l,h=(t,e)=>c.mutate(t,e);class p{constructor(t){this.deleted={},this.original={},this.ops=[];const{target:e,pathArray:r=[],proxyfyAccess:s,dirtyPaths:a}=t;this.pathArray=r,this.targetRef=e,this.proxyfyAccess=s,this.dirtyPaths=a}get(e,a){if("symbol"==typeof a&&a===s)return this.targetRef;if("symbol"==typeof a&&a===r)return!0;if("symbol"==typeof a||"hasOwnProperty"===a)return Reflect.get(e,a);if("string"==typeof a&&this.deleted.hasOwnProperty(a))return;const o=e[a];if("object"==typeof o&&null!==o){if(t.exists(o))return o;const e=this.proxyfyAccess(o,[...this.pathArray,a]);return t.exists(e)||t.cache(e),e}return o}set(t,e,a){this.dirtyPaths.add(this);let o="add";t[e]&&(o=a?"replace":"remove"),!this.original.hasOwnProperty(e)&&t.hasOwnProperty(e)&&(this.original[e]=t[e]);let n=a;if("object"==typeof a&&null!==a){const t=a;n=t.hasOwnProperty(r)?t[s]:{...a}}let i=this.original[e];return"object"==typeof i&&null!==i&&(i={...i}),this.ops.push({op:o,path:""+e,old:i,value:n}),Reflect.set(t,e,a)}deleteProperty(t,e){if(e in t&&"string"==typeof e){this.dirtyPaths.add(this),this.deleted[e]=!0,this.original.hasOwnProperty(e)||(this.original[e]=t[e]);let r=this.original[e];"object"==typeof r&&null!==r&&(r={...r}),this.ops.push({op:"remove",path:""+e,old:r,value:void 0})}return Reflect.deleteProperty(t,e)}getOwnPropertyDescriptor(t,e){if("string"!=typeof e||!this.deleted[e])return e===r?{configurable:!0,value:!0}:Reflect.getOwnPropertyDescriptor(t,e)}ownKeys(t){return Reflect.ownKeys(t)}has(t,e){return Reflect.has(t,e)}}const u=(t,e)=>{if(-1===t.indexOf("**")&&t.length!==e.length)return!1;for(let r=0;r<t.length;r+=1)if(t[r]!==e[r]&&("*"!==t[r]||!e[r])){if(r+1===t.length&&"**"===t[r]&&e[r])return!0;if(e[r]!==t[r])return!1}return!0};class y{constructor(t,e,r,s){this.lastSelectorValue=null,this.selectorName="",this.callbackSet=new Set,this.mappingFn=e,this.disposeMethod=r,this.selectorSet=t.map(t=>t.startsWith("/")?t.substr(1).split("/"):t.split("/")),"development"===process.env.NODE_ENV&&(this.selectorName=s)}reshape(t){this.selectorSet=t(this.selectorSet)}match(t){return((t,e)=>{for(let r=0;r<t.length;r+=1)for(let s=0;s<e.length;s+=1)if(u(t[r],e[s]))return e[s];return!1})(this.selectorSet,t)}run(t,e){const r=this.mappingFn(t,e);this.lastSelectorValue!==r&&(this.lastSelectorValue=r,this.callbackSet.forEach(t=>{t(r)}))}observe(t){if(this.callbackSet.has(t))throw new Error("this callback was already registered. If you run things twice, create two different callbacks");return this.callbackSet.add(t),()=>{this.callbackSet.delete(t)}}dispose(){this.disposeMethod()}}const d=new class{constructor(){this.selectorMap=new WeakMap}registerSelector(t,e){let r=this.selectorMap.get(t);r||(r={selectors:[]},this.selectorMap.set(t,r)),r.selectors.push(e)}removeSelector(t,e){const r=this.selectorMap.get(t);if(!r)return;const s=r.selectors.indexOf(e);-1!==s&&(r.selectors=[...r.selectors.slice(0,s),...r.selectors.slice(s+1)])}processPatches(t,e){const r=this.selectorMap.get(t);if(!r||!r.selectors||0===r.selectors.length)return;if("development"===process.env.NODE_ENV&&window.debug){const t=null==r?void 0:r.selectors.reduce((t,e)=>t[e.selectorName]?(t[e.selectorName]+=1,t):(t[e.selectorName]=1,t),{});console.log(Object.keys(t||{}).reduce((e,r)=>(t[r]>1&&(e[r]=t[r]),e),{}))}const s=e.map(t=>t.pathArray);for(let a=0;a<r.selectors.length;a+=1){const o=r.selectors[a];o.match(s)&&o.run(t,e)}}};exports.IObservableDomain=class{},exports.MutationsManager=l,exports.Patcher=e,exports.ProxyMutationObjectHandler=p,exports.applyInternalMutation=(t,e)=>{t.forEach(t=>{i(t,e)})},exports.applyJSONPatchOperation=i,exports.combinedJSONPatches=a,exports.inversePatch=t=>{const{path:e,pathArray:r,op:s,value:a,old:o}=t;switch(s){case"add":return{op:"remove",value:o,old:a,pathArray:r,path:e};case"remove":return{op:"add",value:o,old:a,pathArray:r,path:e};case"replace":return{op:"replace",value:o,old:a,pathArray:r,path:e}}},exports.mutate=h,exports.mutateFromPatches=(t,e)=>{e&&h(t,t=>{for(let r=0;r<e.length;r+=1)i(e[r],t)})},exports.pathMatchesSource=u,exports.select=(t,e,r,s)=>{const a=d,o=new y(e,r,()=>{a.removeSelector(t,o)},s);return a.registerSelector(t,o),o};
