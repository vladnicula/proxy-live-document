import { Patcher, JSONPatchEnhanced, mutate, mutateFromPatches } from "../src"

class SubTask {
  [Patcher] = true

  id: string = ''
  title: string = ''
  checked: boolean = false

  constructor (id: string, title: string, checked?: boolean) {
    this.id = id
    this.title = title
    this.checked = checked ?? false
  }

  applyPatch (patch: JSONPatchEnhanced) {
    const { op, pathArray, value } = patch

    const lastPartOfPath = pathArray[pathArray.length - 1]
  
    switch (op) {
      case 'replace':  
        // console.log('handle replace op', pathArray, value, {lastPartOfPath})
        break;
    }
  }
}

class SubTaskList {
  [Patcher] = true
  private subtasks: Record<string, SubTask> = {}

  get count () {
    return Object.keys(this.subtasks).length
  }

  set(value: SubTask) {
    this.subtasks[value.id] = value
  }

  get(id: string) {
    return this.subtasks[id]
  }

  remove(id: string) {
    delete this.subtasks[id]
  }

  applyPatch (patch: JSONPatchEnhanced) {
    const { op, pathArray, value } = patch

    const lastPartOfPath = pathArray[pathArray.length - 1]
    const subtaskValue = value as Record<string, unknown>
    switch (op) {
      case 'add':  
        this.set(new SubTask(lastPartOfPath, subtaskValue.title as string, subtaskValue.checked as boolean))
        break;
      case 'remove':  
        this.remove(lastPartOfPath)
        break;
      case 'replace':  
        this.remove(lastPartOfPath)
        this.set(new SubTask(lastPartOfPath, subtaskValue.title as string, subtaskValue.checked as boolean))
        break;
    }
  }
}

class Task {
  [Patcher] = true

  id: string = ''
  title: string = ''
  checked: boolean = false
  readonly subtasks: SubTaskList = new SubTaskList()

  constructor (id: string, title: string, subTasks:  Record<string, SubTask> = {} ) {
    this.id = id
    this.title = title
    Object.keys(subTasks).forEach((subTaskId) => {
      this.subtasks.set(subTasks[subTaskId])
    })
  }

  addSubtask (subTask: SubTask) {
    if ( this.subtasks.count > 2 ) {
      throw new Error(`Max 3 subtasks please!`)
    } 
    this.subtasks.set(subTask)
  }

  removeSubTaskById (subtaskId: string) {
    this.subtasks.remove(subtaskId)
  }

  applyPatch (patch: JSONPatchEnhanced) {
    const { pathArray, value } = patch
  
    switch ( pathArray[0] ) {
      case 'checked':
        this.checked = value as boolean
        break;
      case 'title':
        this.title = value as string
        break;
    }
  }
}

class TaskListProject {
  [Patcher] = true

  tasks: Record<string, Task> = {}

  get taskCount () {
    return Object.keys(this.tasks).length
  }

  addTask (task: Task) {
    this.tasks[task.id] = task
  }

  createTask (title: string, id?: string, checked?: boolean) {
    const newTask = new Task(id || new Date().getTime().toString(), title)
    newTask.checked = checked ?? false
    this.addTask(newTask)
  }

  removeTaskById (id: string) {
    delete this.tasks[id]
  }
  
  applyPatch (patch: JSONPatchEnhanced) {
    const { op, pathArray, value } = patch
    const lastPartOfPath = pathArray[pathArray.length - 1]

    if ( pathArray[0] === 'tasks' && pathArray.length > 1 ) {
      const taskValue = value as Record<string, unknown>
      // console.log(`applyPatch in project`, patch)
      switch (op) {
        case 'add':  
          this.createTask(taskValue.title as string, lastPartOfPath, taskValue.checked as boolean)
          break;
        case 'remove':  
          this.removeTaskById(lastPartOfPath)
          break;
        case 'replace':  
          this.removeTaskById(lastPartOfPath)
          this.createTask(taskValue.title as string, lastPartOfPath, taskValue.checked as boolean)
          break;
      }
    }
  }
}

describe('Task List project test suite', () => {
  it('should have the ability to create and add tasks to the project', () => {
    const taskList = new TaskListProject()
    const myNewTask = new Task('214451', 'Buy milk')
    taskList.addTask(myNewTask)
    taskList.createTask('Call Mom')
    expect(taskList.taskCount).toEqual(2)
  })

  it('should have the ability to create and add sub-tasks to the project', () => {
    const taskList = new TaskListProject()
    const myNewTask = new Task('214451', 'Do Gorcery shopping')
    const myNewSubTask = new SubTask('295195', 'Buy milk')

    taskList.addTask(myNewTask)
    myNewTask.addSubtask(myNewSubTask)

    expect(taskList.taskCount).toEqual(1)
    expect(myNewTask.subtasks.count).toEqual(1)

    myNewTask.addSubtask(new SubTask('1293215', 'Buy chocolate'))
    myNewTask.addSubtask(new SubTask('52932135', 'Buy grapes'))
    const thisShouldFail = () => {
      myNewTask.addSubtask(new SubTask('32932515', 'Buy grapes'))
    }

    expect(thisShouldFail).toThrow()
  })

  it('should allow removing items', () => {
    const taskList = new TaskListProject()
    const myNewTask = new Task('214451', 'Do Gorcery shopping')
    taskList.addTask(myNewTask)
    taskList.removeTaskById(myNewTask.id)
  })
  

  it('creates json patch for task add, update, remove', () => {
    const clientTaskList = new TaskListProject() // client
    const serverTaskList = new TaskListProject() // server

    // ui click -> bla bla bla -> action to add task
    const clientPatchArray = mutate(clientTaskList, (mutateTaskList) => {
      mutateTaskList.createTask('test task')
    })


    // -> ws ->  pe server
    // root.tasks.idx -> applyPatch task
    mutateFromPatches(serverTaskList, clientPatchArray)

    const idOfCreatedTask = Object.keys(clientTaskList.tasks)[0]

    expect(Object.keys(clientTaskList.tasks)).toEqual(Object.keys(serverTaskList.tasks))
    expect(serverTaskList.tasks[idOfCreatedTask]).toBeInstanceOf(Task)


    const NEW_TASK_TITLE = 'renamed task title'
    const jsonPatchForModificationOfTask = mutate(clientTaskList, (mutateTaskList) => {
      const targetTask = mutateTaskList.tasks[idOfCreatedTask]
      targetTask.title = NEW_TASK_TITLE
      targetTask.checked = true
    })

    mutateFromPatches(serverTaskList, jsonPatchForModificationOfTask)

    expect(serverTaskList.tasks[idOfCreatedTask]).toHaveProperty('checked', true)
    expect(serverTaskList.tasks[idOfCreatedTask]).toHaveProperty('title', NEW_TASK_TITLE)

    const jsonPatchForDelete = mutate(clientTaskList, (mutateTaskList) => {
      mutateTaskList.removeTaskById(idOfCreatedTask)
    })

    mutateFromPatches(serverTaskList, jsonPatchForDelete)
    expect(serverTaskList.tasks[idOfCreatedTask]).toBeUndefined()
  })

  
})
