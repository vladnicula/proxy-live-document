import { describe, it, expect } from 'vitest'
import { MutationTreeNode, NO_VALUE } from '../../src'
import { makeAndGetChildPointer, createMutaitonInMutationTree } from '../../src/mutation-map'

describe('working with children nodes in mutation tree', () => {
    it('makeAndGetChildPointer adds a new leaf in tree', () => {
        const rootMutatioNode = {
            p: null,
            k: ''
        } as MutationTreeNode
      
        makeAndGetChildPointer(rootMutatioNode, 'subKey')
    
        expect(rootMutatioNode).toHaveProperty('c')
        expect(rootMutatioNode.c).toHaveProperty('subKey')
        expect(Object.keys(rootMutatioNode.c ?? {})).toHaveLength(1)


        makeAndGetChildPointer(rootMutatioNode, 'subKey')
        expect(Object.keys(rootMutatioNode.c ?? {})).toHaveLength(1)
    })

    it('makeAndGetChildPointer adds a new leafs near existing leafs', () => {
        const rootMutatioNode = {
            p: null,
            k: ''
        } as MutationTreeNode
      
        makeAndGetChildPointer(rootMutatioNode, 'subKey')
    
        expect(rootMutatioNode).toHaveProperty('c')
        expect(rootMutatioNode.c).toHaveProperty('subKey')
        expect(Object.keys(rootMutatioNode.c ?? {})).toHaveLength(1)


        makeAndGetChildPointer(rootMutatioNode, 'subKey2')
        expect(rootMutatioNode.c).toHaveProperty('subKey2')
        expect(Object.keys(rootMutatioNode.c ?? {})).toHaveLength(2)
    })

    it("merges simple value in parent", () => {

        // root.abc is 5 initially
        // root.abc.field = 32
        // we get these 3 nodes

        /*
            {
                k: "root",
                p: null,
                c: {
                    "abc": {
                        p: rootNode,
                        k: "abc",
                        c: {
                            "field": {
                                p: abcNode
                                k: "field",
                                old: 5,
                                new: 32
                            }
                        }
                    }
            }
         */

        const root: MutationTreeNode = {
            k: "root",
            p: null,
        }

        const abcNode: MutationTreeNode = {
            p: root,
            k: "abc",
        }

        const fieldNode: MutationTreeNode = {
            p: abcNode,
            k: "field",
            old: 5,
            new: 32
        }

        root.c = {
            abc: abcNode
        }

        abcNode.c = {
            field: fieldNode
        }

        // now we want to change the abcNode to contain an operation. 
        createMutaitonInMutationTree(
            abcNode,
            // OLD VALUE
            // the reference (in this case faked as an inline object) of the "abc" object
            {
                someValue: 100,
                field: 32
            },
            // NO new value = NO_VALUE, a falsy value with the express intent to indicate
            // the lack of a value
            NO_VALUE,
        )

        // after the remove, we no longer have sub operations in the mutation tree
        // UPDATE: but we should still have the nodes for further reference
        // expect(Object.keys(abcNode.c ?? {})).toHaveLength(0)

        // and the previous change ot field, from 5 to 32 is now encoded in the old
        // value of the abc ndoe
        expect(abcNode).toHaveProperty('old', {
            someValue: 100,
            // super important, its 5, not 32!
            field: 5
        })

        expect(abcNode).toHaveProperty('op', 'remove')
    })

    it('merges simple value into parent that has a replace operation created', () => {

        // root.abc is 5 initially
        // root.abc.field = 32
        // we get these 3 nodes

        /*
            {
                k: "root",
                p: null,
                c: {
                    "abc": {
                        p: rootNode,
                        k: "abc",
                        c: {
                            "field": {
                                p: abcNode
                                k: "field",
                                old: 5,
                                new: 32
                            }
                        }
                    }
            }
         */

            const root: MutationTreeNode = {
                k: "root",
                p: null,
            }
    
            const abcNode: MutationTreeNode = {
                p: root,
                k: "abc",
            }
    
            const fieldNode: MutationTreeNode = {
                p: abcNode,
                k: "field",
                old: 5,
                new: 32
            }
    
            root.c = {
                abc: abcNode
            }
    
            abcNode.c = {
                field: fieldNode
            }
    
            // now we want to change the abcNode to contain an operation. 
            createMutaitonInMutationTree(
                abcNode,
                // OLD VALUE
                // the reference (in this case faked as an inline object) of the "abc" object
                {
                    someValue: 100,
                    field: 32
                },
                // NO new value = NO_VALUE, a falsy value with the express intent to indicate
                // the lack of a value
                {
                    someValue: 200,
                    field: 100
                },
            )
    
            // after the remove, we no longer have sub operations in the mutation tree
            // UPDATE: But we should still have the children for further reference
            // expect(Object.keys(abcNode.c ?? {})).toHaveLength(0)
    
            // and the previous change ot field, from 5 to 32 is now encoded in the old
            // value of the abc ndoe
            expect(abcNode).toHaveProperty('old', {
                someValue: 100,
                // super important, its 5, not 32!
                field: 5
            })

            expect(abcNode).toHaveProperty('new', {
                someValue: 200,
                field: 100
            })
    
            expect(abcNode).toHaveProperty('op', 'replace')
    })

    it("[Child change first] mergest patches multiple levels deep", () => {
        // root.firstLayer.secondLayerA.thirdLayerA = 32 (from 5)
        // root.firstLayer.secondLayerB.thirdLayerB = "new stuff" (from "old stuff")
        // root.firstLayer = "x"

        const root: MutationTreeNode = {
            k: "root",
            p: null,
        }

        const firstLayer: MutationTreeNode = {
            p: root,
            k: "firstLayer",
        }

        const secondLayerA: MutationTreeNode = {
            p: firstLayer,
            k: "secondLayerA",
        }

        const secondLayerB: MutationTreeNode = {
            p: firstLayer,
            k: "secondLayerB",
        }

        const thirdLayerA: MutationTreeNode = {
            p: secondLayerA,
            k: "thirdLayerA",
            old: 5,
            new: 32
        }

        const thirdLayerB: MutationTreeNode = {
            p: secondLayerB,
            k: "thirdLayerB",
            old: "old stuff",
            new: "new stuff"
        }

        root.c = {
            "firstLayer": firstLayer
        }

        firstLayer.c = {
            "secondLayerA": secondLayerA,
            "secondLayerB": secondLayerB
        }

        secondLayerA.c = {
            "thirdLayerA": thirdLayerA
        }

        secondLayerB.c = {
            "thirdLayerB": thirdLayerB
        }

        // now we want to change the abcNode to contain an operation. 
        createMutaitonInMutationTree(
            firstLayer,
            // OLD VALUE
            {
                secondLayerA: {
                    aKeyNotTouchedByAnything: "this_should_be_the_same",
                    thirdLayerA: 32
                },
                secondLayerB: {
                    anotherKeyNotTouchedByAnything: "this_should_be_the_same",
                    thirdLayerB: "this value will actually be ignored"
                }
            },
            // NEW VALUE
            'x',
        )

        // after the remove, we no longer have sub operations in the mutation tree
        // expect(Object.keys(firstLayer.c ?? {})).toHaveLength(0)

        // and the previous change ot field, from 5 to 32 is now encoded in the old
        // value of the abc ndoe
        expect(firstLayer).toHaveProperty('old', {
            secondLayerA: {
                aKeyNotTouchedByAnything: "this_should_be_the_same",
                thirdLayerA: 5
            },
            secondLayerB: {
                anotherKeyNotTouchedByAnything: "this_should_be_the_same",
                thirdLayerB: "old stuff"
            }
        })

        expect(firstLayer).toHaveProperty('new', 'x')
    })

    it("creates an add operation on a mutation node", () => {
        // root.firstLayer = { foo: { bar: 5 } } (from nothing)
        const root: MutationTreeNode = {
            k: "root",
            p: null,
        }

        const firstLayer: MutationTreeNode = {
            p: root,
            k: "firstLayer",
        }

        root.c = {
            "firstLayer": firstLayer
        }

        createMutaitonInMutationTree(
            firstLayer,
            // OLD VALUE
            NO_VALUE,
            // NEW VALUE
            { foo: { bar: 5 } }
        )

        expect(firstLayer).toHaveProperty('new', { foo: { bar: 5 } })
        expect(firstLayer).toHaveProperty('op', 'add')
    })

    it("creates an remove mutation on a node", () => {
        // root.firstLayer = { foo: { bar: 5 } } (from nothing)
        const root: MutationTreeNode = {
            k: "root",
            p: null,
        }

        const firstLayer: MutationTreeNode = {
            p: root,
            k: "firstLayer",
        }

        root.c = {
            "firstLayer": firstLayer
        }

        createMutaitonInMutationTree(
            firstLayer,
            // OLD VALUE
            { foo: { bar: 5 } },
            // NEW VALUE
            NO_VALUE
        )

        expect(firstLayer).toHaveProperty('old', { foo: { bar: 5 } })
        expect(firstLayer).toHaveProperty('op', 'remove')
    })

    it("[Child change first] creates an replace mutation on a node", () => {
        // root.firstLayer = { foo: { bar: 5 } } (from 5)
        const root: MutationTreeNode = {
            k: "root",
            p: null,
        }

        const firstLayer: MutationTreeNode = {
            p: root,
            k: "firstLayer",
        }

        root.c = {
            "firstLayer": firstLayer
        }

        createMutaitonInMutationTree(
            firstLayer,
            // OLD VALUE
            5,
            // NEW VALUE
            { foo: { bar: 5 } }
        )

        

        expect(firstLayer).toHaveProperty('new', { foo: { bar: 5 } })
        expect(firstLayer).toHaveProperty('old', 5)
        expect(firstLayer).toHaveProperty('op', 'replace')
    })

    it("[Parent change first] merges an add on layer A and update into layer B under A to an add on layer A", () => {
        // root.firstLayer = { foo: { bar: 5 } } (from nothing)
        // root.firstLayer.foo.bar = 32 (from "5")

        const root: MutationTreeNode = {
            k: "root",
            p: null,
        }

        const firstLayer: MutationTreeNode = {
            p: root,
            k: "firstLayer",
        }

        root.c = {
            "firstLayer": firstLayer
        }

        // root.firstLayer = { foo: { bar: 5 } } (from nothing)
        createMutaitonInMutationTree(firstLayer, NO_VALUE, { foo: { bar: 5 } })

    
        // root.firstLayer.foo.bar = 32 (from "5")
        // we first make the mutation nodes (which should be done in the proxy handler)
        const foo: MutationTreeNode = {
            p: firstLayer,
            k: "foo",
        }
        firstLayer.c = {
            "foo": foo
        }

        const bar: MutationTreeNode = {
            p: foo,
            k: "bar",
        }
        foo.c = {
            "bar": bar
        }

        createMutaitonInMutationTree(bar, 5, 32)

        expect(firstLayer).toHaveProperty('op', 'add')
        expect(firstLayer).toHaveProperty('new', { foo: { bar: 32 } })

        
    })

    it("[Parent change first] merges an update on layer A and update into layer B under A to an update on layer A", () => {
        // root.firstLayer = { foo: { bar: 5 } } ( {somethingCompleteley: "different"})
        // root.firstLayer.foo.bar = 32 (from "5")

        const root: MutationTreeNode = {
            k: "root",
            p: null,
        }

        const firstLayer: MutationTreeNode = {
            p: root,
            k: "firstLayer",
        }

        root.c = {
            "firstLayer": firstLayer
        }

        // root.firstLayer = { foo: { bar: 5 } } (from {somethingCompleteley: "different"})
        createMutaitonInMutationTree(firstLayer, { somethingCompleteley: "different" }, { foo: { bar: 5 } })

    
        // root.firstLayer.foo.bar = 32 (from "5")
        // we first make the mutation nodes (which should be done in the proxy handler)
        const foo: MutationTreeNode = {
            p: firstLayer,
            k: "foo",
        }
        firstLayer.c = {
            "foo": foo
        }

        const bar: MutationTreeNode = {
            p: foo,
            k: "bar",
        }
        foo.c = {
            "bar": bar
        }

        createMutaitonInMutationTree(bar, 5, 32)

        expect(firstLayer).toHaveProperty('op', 'replace')
        expect(firstLayer).toHaveProperty('old', { somethingCompleteley: "different" })
        expect(firstLayer).toHaveProperty('new', { foo: { bar: 32 } })
    })

    it("[Parent change first] merges an update on layer A and two updates on layer B on the same key under A to an update on layer A", () => {
        // root.firstLayer = { foo: { bar: 5 } } ( {somethingCompleteley: "different"})
        // root.firstLayer.foo.bar = 32 (from "5")
        // root.firstLayer.foo.bar = 100 (from "32")

        const root: MutationTreeNode = {
            k: "root",
            p: null,
        }

        const firstLayer: MutationTreeNode = {
            p: root,
            k: "firstLayer",
        }

        root.c = {
            "firstLayer": firstLayer
        }

        // root.firstLayer = { foo: { bar: 5 } } (from {somethingCompleteley: "different"})
        createMutaitonInMutationTree(firstLayer, {somethingCompleteley: "different"}, { foo: { bar: 5 } })

    
        // root.firstLayer.foo.bar = 32 (from "5")
        // we first make the mutation nodes (which should be done in the proxy handler)
        const foo: MutationTreeNode = {
            p: firstLayer,
            k: "foo",
        }
        firstLayer.c = {
            "foo": foo
        }

        const bar: MutationTreeNode = {
            p: foo,
            k: "bar",
        }
        foo.c = {
            "bar": bar
        }

        createMutaitonInMutationTree(bar, 5, 32)
        expect(firstLayer).toHaveProperty('op', 'replace')
        expect(firstLayer).toHaveProperty('old', { somethingCompleteley: "different" })
        expect(firstLayer).toHaveProperty('new', { foo: { bar: 32 } })

        // root.firstLayer.foo.bar = 100 (from "32")
        createMutaitonInMutationTree(bar, 32, 100)

        expect(firstLayer).toHaveProperty('op', 'replace')
        expect(firstLayer).toHaveProperty('old', { somethingCompleteley: "different" })
        expect(firstLayer).toHaveProperty('new', { foo: { bar: 100 } })
    })

    describe("basic behaviours", () => {
        it("kees the old original value when modifing a value multiple times", () => {
            /**
             * If we write multiple tiems on the same path, we don't need to update
             * the original old value, only the new one.
             */
            const root: MutationTreeNode = {
                k: "root",
                p: null,
            }
    
            const firstLayer: MutationTreeNode = {
                p: root,
                k: "firstLayer",
            }

            root.c = {
                firstLayer
            }


            createMutaitonInMutationTree(firstLayer, NO_VALUE, 32)
            createMutaitonInMutationTree(firstLayer, 32, 100)
            expect(firstLayer).toHaveProperty('op', 'add')
            expect(firstLayer).not.toHaveProperty('old')
            expect(firstLayer).toHaveProperty('new', 100)
        })

        it("keeps the old original value when modifing a value multiple times, ending with a delete", () => {
            /**
             * If we write multiple tiems on the same path, we don't need to update
             * the original old value, only the new one.
             */
            const root: MutationTreeNode = {
                k: "root",
                p: null,
            }
    
            const firstLayer: MutationTreeNode = {
                p: root,
                k: "firstLayer",
            }

            root.c = {
                firstLayer
            }

            // if we say we had an original value, 5, then we don't 
            // make an add, we will make an update initially
            createMutaitonInMutationTree(firstLayer, 5, 32)
            // this is the intermediary update
            createMutaitonInMutationTree(firstLayer, 32, 100)
            // this is the delete
            createMutaitonInMutationTree(firstLayer, 100, NO_VALUE)

            // so we end up with a remove, an no intermediary 32 or 100 values
            expect(firstLayer).toHaveProperty('op', 'remove')
            expect(firstLayer).toHaveProperty('old', 5)
            expect(firstLayer).not.toHaveProperty('new')
        })
    })

    it("changes to a child before and after a change on the parent should accumulate on the parent, and the parent should keep the first original old value of that child", () => {
        /**
         * We change a child from foo 5 -> 32
         * We change the parent completely, by setting a new object, let's say with foo -1
         * We change the child foo again, foo -1 -> 100
         *
         * The parent should show foo: 5 in the old values, not foo -1
         */

        /**
         * If we write multiple tiems on the same path, we don't need to update
         * the original old value, only the new one.
         */
        const root: MutationTreeNode = {
            k: "root",
            p: null,
        }

        const firstLayer: MutationTreeNode = {
            p: root,
            k: "firstLayer",
        }

        root.c = {
            firstLayer
        }

        const foo: MutationTreeNode = {
            p: firstLayer,
            k: "foo",
        }
        firstLayer.c = {
            "foo": foo
        }

        // foo = 32 (from 5)
        createMutaitonInMutationTree(foo, 5, 32)

        // parent = {foo: -1}
        createMutaitonInMutationTree(firstLayer, {foo: 32}, { foo: -1})

        // foo = 100
        createMutaitonInMutationTree(foo, -1, 100)

        expect(firstLayer).toHaveProperty('op', 'replace')
        expect(firstLayer).toHaveProperty('old', {
            foo: 5
        })
        expect(firstLayer).toHaveProperty('new', {
            foo: 100
        })
    })

    /**
     * Tests where we check how 3 levels of a deep object are handled.
     * The 3 levels can have intermediary levels that don't hold any updates
     * but are relevant
     */
    describe("modifing 3 layers of the same branch, A - .. - B - .. - C", () => {
        /**
         * Initial state
         * state = {
         *      layer1: {
         *          layer2: {
         *              foo: 5
         *          }
         *       }
         * }
         * 
         * Operations:
         * state.layer1.layer2.foo = 32 (from 5)
         * state.layer1 = { layer2: { foo: 100 } } (from { layer2: { foo: 32} } )
         * state.layer1.layer2 = {
         *      foo: 200,
         *      aNewKey: 'new one'
         * }
         * 
         * Expectation
         * layer1: {
         *      op: "replace",
         *      old: { layer2: { foo: 5 } },
         *      new: { layer2: { foo: 200, aNewKey: 'new one' } }
         * }
         */
        it("It handles change leaf, replace top ancestor with same structure object, replace intermediary ancestor with same structure object", () => {
            const root: MutationTreeNode = {
                k: "root",
                p: null,
            }
    
            const layer1: MutationTreeNode = {
                p: root,
                k: "layer1",
            }

            const layer2: MutationTreeNode = {
                p: layer1,
                k: "layer2",
            }

            const foo: MutationTreeNode = {
                p: layer2,
                k: "foo",
            }

            root.c = {
                layer1
            }

            layer1.c = {
                layer2
            }

            layer2.c = {
                foo
            }

            // foo = 32 (from 5)
            createMutaitonInMutationTree(foo, 5, 32)

            // layer1 = { layer2: { foo: 100 } } (from { layer2: { foo: 32} } )
            createMutaitonInMutationTree(layer1, {
                layer2: { foo: 32 }
            }, {
                layer2: { foo: 100 }
            })

            /**
             * state.layer1.layer2 = {
             *      foo: 200,
             *      aNewKey: 'new one'
             * }
             */
            createMutaitonInMutationTree(layer2, {
                foo: 100
            }, {
                foo: 200,
                aNewKey: 'new one'
            })

            expect(layer1).toHaveProperty('op', 'replace')
            expect(layer1).toHaveProperty('new', {
                layer2: {
                    foo: 200,
                    aNewKey: 'new one'
                }
            })
            expect(layer1).toHaveProperty('old', {
                layer2: {
                    foo: 5
                }
            })
        })

        /**
         * Initial state
         * state = {
         *      layer1: {
         *          layer2: {
         *              foo: 5
         *          }
         *       }
         * }
         * 
         * Operations:
         * state.layer1 = { layer2: { foo: 100 } } (from { layer2: { foo: 5 } } )
         * 
         * * state.layer1.layer2 = {
         *      foo: 200,
         *      aNewKey: 'new one'
         * }
         * 
         * state.layer1.layer2.foo = 32 (from 200)
         * 
         * Expectation
         * layer1: {
         *      op: "replace",
         *      old: { layer2: { foo: 5 } },
         *      new: { layer2: { foo: 32, aNewKey: 'new one' } }
         * }
         */
        it("handles the 3 layers update when the last update will have 2 nodes with ops on the same branch", () => {
            const root: MutationTreeNode = {
                k: "root",
                p: null,
            }
    
            const layer1: MutationTreeNode = {
                p: root,
                k: "layer1",
            }

            const layer2: MutationTreeNode = {
                p: layer1,
                k: "layer2",
            }

            const foo: MutationTreeNode = {
                p: layer2,
                k: "foo",
            }

            root.c = {
                layer1
            }

            layer1.c = {
                layer2
            }

            layer2.c = {
                foo
            }

            // layer1 = { layer2: { foo: 100 } } (from { layer2: { foo: 32} } )
            createMutaitonInMutationTree(layer1, {
                layer2: { foo: 5 }
            }, {
                layer2: { foo: 100 }
            })

            expect(layer1).toHaveProperty('op', 'replace')
            expect(layer1).toHaveProperty('new', {
                layer2: {
                    foo: 100,
                }
            })
            expect(layer1).toHaveProperty('old', {
                layer2: {
                    foo: 5
                }
            })

            /**
             * state.layer1.layer2 = {
             *      foo: 200,
             *      aNewKey: 'new one'
             * }
             */
            createMutaitonInMutationTree(layer2, {
                foo: 100
            }, {
                foo: 200,
                aNewKey: 'new one'
            })

            expect(layer1).toHaveProperty('op', 'replace')
            expect(layer1).toHaveProperty('new', {
                layer2: {
                    foo: 200,
                    aNewKey: 'new one'
                }
            })
            expect(layer1).toHaveProperty('old', {
                layer2: {
                    foo: 5
                }
            })

            // foo = 32 (from 5)
            createMutaitonInMutationTree(foo, 200, 32)

            expect(layer1).toHaveProperty('op', 'replace')
            expect(layer1).toHaveProperty('new', {
                layer2: {
                    foo: 32,
                    aNewKey: 'new one'
                }
            })
            expect(layer1).toHaveProperty('old', {
                layer2: {
                    foo: 5
                }
            })
        })

    })

    describe("multi branch operations", () => {
        it("shoiuld test what happens when changes are made on multiple layers as well")
        
        // also test layer two change which does not include this key.
        // does it get propagated out to another ancestor?
        it("3 layers. 1 -> 2 -> 3. We change layer 2, then 1, then 3. Changes get accumulated in layer 1",  () => {
            const root: MutationTreeNode = {
                k: "root",
                p: null,
            }
    
            const layer1: MutationTreeNode = {
                p: root,
                k: "layer1",
            }

            const layer2: MutationTreeNode = {
                p: layer1,
                k: "layer2",
            }

            const foo: MutationTreeNode = {
                p: layer2,
                k: "foo",
            }

            root.c = {
                layer1
            }

            layer1.c = {
                layer2
            }

            layer2.c = {
                foo
            }

            /**
             * state.layer1.layer2 = {
             *      foo: 100,
             *      aNewKey: 'new one'
             * }
             */
            createMutaitonInMutationTree(layer2, {
                foo: 32
            }, {
                foo: 100,
                aNewKey: 'new one'
            })

            expect(layer2).toHaveProperty('op', 'replace')
            expect(layer2).toHaveProperty('new', {
                foo: 100,
                aNewKey: 'new one'
            })
            expect(layer2).toHaveProperty('old', {
                foo: 32
            })

            // layer1 = { layer2: { foo: 0, aNewKey: 'a new one'} } (from { layer2: { foo: 100, aNewKey: 'a new one'} } )
            createMutaitonInMutationTree(layer1, {
                layer2: { foo: 100, aNewKey: 'a new one' }
            }, {
                layer2: { foo: 0, aNewKey: 'a new one' }
            })

            expect(layer1).toHaveProperty('op', 'replace')
            expect(layer1).toHaveProperty('new', {
                layer2: {
                    foo: 0,
                    aNewKey: 'a new one'
                }
            })
            expect(layer1).toHaveProperty('old', {
                layer2: {
                    foo: 32
                }
            })

            createMutaitonInMutationTree(foo, 0, 1000)

            expect(layer1).toHaveProperty('op', 'replace')
            expect(layer1).toHaveProperty('new', {
                layer2: {
                    foo: 1000,
                    aNewKey: 'a new one'
                }
            })
            expect(layer1).toHaveProperty('old', {
                layer2: {
                    foo: 32
                }
            })

        })

    })

})

