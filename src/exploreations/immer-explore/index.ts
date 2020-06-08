import { Draft, produceWithPatches, setAutoFreeze, enablePatches, Patch } from "immer";
import { myDocument, NodeClassEntity } from "./data";

enablePatches();
setAutoFreeze(true);
console.log("document with", Object.keys(myDocument.nodes).length, "nodes");

const [state, patches] = produceWithPatches(myDocument, (draf: Draft<typeof myDocument>) => {
  draf.nodes["id1"].addStyleByKey("backgroundColor", {
    content: "red"
  });

  const newNode = new NodeClassEntity()
  draf.nodes["id2"] = newNode
  newNode.addStyleByKey('broder', {content: '1px solid red'})
  draf.nodes["id2"].addStyleByKey('background', {content: 'blue'})
  draf.nodes["id2"].addStyleByKey('broder', {content: '3px dotted yellow'})
});

console.log({ state, patches });

const dispatchCustomEvents = (patches: Patch[]) => {
  for (let i = 0; i < patches.length; i += 1) {
    console.log("pick what to trigger", patches[i]);
    const patchPath = patches[i].path
    if ( patchPath[2] === 'styles' ) {
      console.log('emit style update event for nodeId', patchPath[1])
    }

    if ( patchPath[0] === 'nodes' && patchPath.length < 3 ) {
      console.log('style event might be needed because of the node remove/add/update', patchPath)
      console.log('emit node event for nodeId', patchPath[1])
    }
  }
};

dispatchCustomEvents(patches);
