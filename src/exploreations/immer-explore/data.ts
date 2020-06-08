import { immerable } from 'immer';

export class NodeClassEntity {
  [immerable] = true;

  private styles: Record<string, { [key: string]: any }> = {};

  constructor (initialJSON: Record<string, unknown> = {}) {
    const { styles } = initialJSON
    if ( styles && typeof styles === 'object' ) {
      Object.assign(this.styles, styles)
    }
  }

  addStyleByKey (key: string, value: { [key: string]: any }) {
    this.styles[key] = value;
  };
}

const myDocument: {
  nodes:Record<string, NodeClassEntity>;
} = {
  nodes: {
    id1: new NodeClassEntity({
        paddingTop: {
          type: "static",
          content: "32px"
        }
    }),

    id2: new NodeClassEntity({
      paddingTop: {
        type: "static",
        content: "32px"
      }
    })
  }
};
for (let i = 0; i < 10000; i += 1) {
  myDocument.nodes[`id-mock-${i}`] = new NodeClassEntity({
      paddingTop: {
        type: "static",
        content: "32px"
      }
  })
}

export { myDocument };
