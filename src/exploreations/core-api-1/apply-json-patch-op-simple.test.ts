import { applyJSONPatchOperation } from "."

describe('applyJSONPatchOperation - simple', () => {
  describe('plain structure', () => {
    const simpleStruct = {
      userName: 'jhon',
      password: '1234',
      name: "Jhon",
      lastName: 'Smith'    
    }

    it('applies add on plain structure', () => {
      const testStruct = {...simpleStruct}
      const op = {
        op: 'add' as 'add',
        pathArray: ['nickName'],
        path: '/nickName',
        value: 'Jhonny'
      }
      applyJSONPatchOperation(op, testStruct)
      expect(testStruct).toHaveProperty('nickName', 'Jhonny')
    })

    it('applies remove on plain structure', () => {
      const testStruct = {...simpleStruct}
      const op = {
        op: 'remove' as 'remove',
        pathArray: ['userName'],
        path: '/userName',
        value: undefined,
        old: 'Jhon'
      }
      applyJSONPatchOperation(op, testStruct)
      expect(testStruct).not.toHaveProperty('userName')
    })

    it('applies replace on plain structure', () => {
      const testStruct = {...simpleStruct}
      const op = {
        op: 'replace' as 'replace',
        pathArray: ['userName'],
        path: '/userName',
        value: 'Jhonny',
        old: "Jhon"
      }
      applyJSONPatchOperation(op, testStruct)
      expect(testStruct).toHaveProperty('userName', 'Jhonny')
    })

  })

  describe('plain nested structure', () => {
    const nestedStruct = {
      todos: {
        id1: {
          pos: 1,
          title: 'ok',
          checked: false
        },
        id2: {
          pos: 2,
          title: 'ok',
          checked: false
        },
        id3: {
          pos: 3,
          title: 'ok',
          checked: false
        },
        id4: {
          pos: 4,
          title: 'ok',
          checked: false
        },
        id5: {
          pos: 5,
          title: 'ok',
          checked: false
        }
      }
    }

    it('applies add on nested plain structure', () => {
      const testStruct = {...nestedStruct, todos: {...nestedStruct.todos}}
      const op = {
        op: 'add' as 'add',
        pathArray: ['todos', 'id2', 'category'],
        path: 'todos/id2/category',
        value: 'chroes'
      }
      applyJSONPatchOperation(op, testStruct)
      expect(testStruct.todos.id2).toHaveProperty('category', 'chroes')
    })

    it('applies remove on nested plain structure', () => {
      const testStruct = {...nestedStruct, todos: {...nestedStruct.todos}}
      const op = {
        op: 'remove' as 'remove',
        pathArray: ['todos', 'id2'],
        path: 'todos/id2',
        value: undefined
      }
      applyJSONPatchOperation(op, testStruct)
      expect(testStruct.todos).not.toHaveProperty('id2')
    })

    it('applies replace on nested plain structure', () => {
      const testStruct = {...nestedStruct, todos: {...nestedStruct.todos}}
      const op = {
        op: 'replace' as 'replace',
        pathArray: ['todos', 'id2'],
        path: 'todos/id2',
        value: {
          pos: 66,
          title: 'new titles',
          checked: true
        }
      }
      applyJSONPatchOperation(op, testStruct)
      expect(testStruct.todos.id2).toEqual({
        pos: 66,
        title: 'new titles',
        checked: true
      })
    })
  })
  
})