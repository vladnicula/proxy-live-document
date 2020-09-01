import { Patcher, JSONPatchEnhanced, mutate, mutateFromPatches, select } from "../src"

class Task {
  [Patcher] = true

  static mapFromJSON = (json: Record<string, unknown>) => {
    const {id, title, checked, parentId} = json as {
      id: string
      title: string
      checked: boolean
      parentId?: string
    }

    const t = new Task(id, title)
    t.checked = checked
    t.parentId = parentId
  
    return t
  }

  id: string = ''
  title: string = ''
  checked: boolean = false
  parentId: string = 'root'
  pos: string = '0'

  constructor (id: string, title: string) {
    this.id = id
    this.title = title
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

  tasks: Record<string, Task | null> = {}
  // problem in current mutation library because we don't support arrays (yet?!)
  taskHierarchy: Record<string, Record<string, true>> = {
    root: {}
  }

  get taskCount () {
    return Object.keys(this.tasks).length
  }

  addTask (task: Task) {
    this.tasks[task.id] = task
    this.taskHierarchy[task.parentId] = this.taskHierarchy[task.parentId] || {}
    this.taskHierarchy[task.parentId][task.id] = true 
  }

  getOrderedSubtasksIds (taskId: string) {
    return Object.keys(this.taskHierarchy[taskId] || {}).sort((subId1, subId2) => {
      const pos1 = this.tasks[subId1].pos
      const pos2 = this.tasks[subId2].pos
      // this is where the fractional magic would happen
      return parseFloat(pos1) - parseFloat(pos2)
    })
  }

  createTask (title: string, id?: string, checked?: boolean, parentId: string = 'root') {
    const newTask = new Task(id || new Date().getTime().toString(), title)
    newTask.checked = checked ?? false
    newTask.parentId = parentId
    this.addTask(newTask)
  }
  

  addSubtask (taskId: string, subTask: Task) {
    const subtasksOfTask = this.taskHierarchy[taskId] || {}
    if ( Object.keys(subtasksOfTask).length > 2 ) {
      throw new Error(`Max 3 subtasks please!`)
    } 
    subTask.parentId = taskId
    this.taskHierarchy[taskId] = this.taskHierarchy[taskId] || {}
    this.taskHierarchy[taskId][subTask.id] = true
    this.tasks[subTask.id] = subTask
  }

  removeSubTaskById (taskId:string, subtaskId: string) {
    delete this.tasks[subtaskId]
    delete this.taskHierarchy[taskId][subtaskId]
  }

  createSubtask (params: {taskId: string, subTaskId?: string, subtaskTitle: string, checked?: boolean}) {
    const { taskId, checked, subtaskTitle, subTaskId } = params
    const newTask = new Task(subTaskId || new Date().getTime().toString(), subtaskTitle)
    newTask.checked = checked ?? false
    this.addSubtask(taskId, newTask)
  }

  removeTaskById (id: string) {
    const targeTask = this.tasks[id]
    if ( !targeTask ) {
      return
    }
    const parentId = targeTask.parentId
    delete this.tasks[id]
    const ids = this.taskHierarchy[id] || {}
    Object.keys(ids).forEach((id) => {
      this.removeTaskById(id)
    })
    delete this.taskHierarchy[id]
    delete this.taskHierarchy[parentId][id]
  }

  moveSubTaskToParent (params: {sourceTaskId: string, destTaskId: string, subtaskId: string, pos?: string}) {
    const { sourceTaskId, destTaskId, subtaskId, pos } = params
    delete this.taskHierarchy[sourceTaskId][subtaskId]
    this.taskHierarchy[sourceTaskId][destTaskId] = true
    this.tasks[subtaskId].parentId = destTaskId
    this.tasks[subtaskId].pos = pos ?? '0'
  }
  
  applyPatch (patch: JSONPatchEnhanced) {
    const { op, pathArray, value } = patch
    const lastPartOfPath = pathArray[pathArray.length - 1]
    if ( pathArray[0] === 'tasks' && pathArray.length > 1 ) {
      const taskValue = value as Record<string, unknown>
      // console.log(`applyPatch in project`, patch)
      switch (op) {
        case 'add':  
          this.createTask(taskValue.title as string, lastPartOfPath, taskValue.checked as boolean, taskValue.parentId as string)
          break;
        case 'remove':
          this.removeTaskById(lastPartOfPath)
          break;
        case 'replace':  
          this.removeTaskById(lastPartOfPath)
          this.createTask(taskValue.title as string, lastPartOfPath, taskValue.checked as boolean, taskValue.parentId as string)
          break;
      }
    }
  }

  mapFromJSON (json: Record<string, unknown>) {
    console.log('should map data from a JSON into the actual project', json)
    const { tasks, taskHierarchy } = json
    const tasksAsJSONofTask = tasks as 
      Record<
        string, 
        {
          title: string, 
          checked: boolean, 
          id: string, 
        }
      >

    Object.keys(tasksAsJSONofTask).forEach((key) => {
      const taskJSON = tasksAsJSONofTask[key]
      const task = Task.mapFromJSON(taskJSON)
      this.addTask(task)
    })
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
    const myNewSubTask = new Task('295195', 'Buy milk')
    myNewSubTask.parentId = myNewTask.id
    taskList.addTask(myNewTask)
    taskList.addTask(myNewSubTask)

    expect(taskList.taskCount).toEqual(2)
    expect(Object.keys(taskList.taskHierarchy[myNewTask.id]).length).toEqual(1)

    taskList.createSubtask({
      taskId: myNewTask.id,
      subtaskTitle: 'Buy chocolate',
      subTaskId: '1293215'
    })

    taskList.createSubtask({
      taskId: myNewTask.id,
      subtaskTitle: 'Buy grapes',
      subTaskId: '52932135'
    })
    
    const thisShouldFail = () => {
      taskList.createSubtask({
        taskId: myNewTask.id,
        subtaskTitle: 'Buy grapes 2',
        subTaskId: '32932515'
      })    }

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

  it('observed updates on hierarchy and task content at the same time', () => {
    const taskListProject = new TaskListProject()
    const targetTaskId = '214451'
    const targetSubTaskId = '32115'
    const myNewTask = new Task(targetTaskId, 'Do Gorcery shopping')
    const myNewSubTask = new Task(targetSubTaskId, 'Buy milk')
    myNewSubTask.parentId = myNewTask.id

    const mapperSpy = jest.fn()
    const callbackSpy = jest.fn()

    const taskKeysSubscription = select(taskListProject, [
      `tasks/${targetTaskId}/**`,
      `taskHierarchy/${targetTaskId}`
    ], (doc) => {
      mapperSpy()
      return {
        taskData: doc.tasks[targetTaskId],
        taskChildren: taskListProject.getOrderedSubtasksIds(targetTaskId)
      }
    })

    taskListProject.addTask(myNewTask)
    taskKeysSubscription.observe(callbackSpy)

    mutate(taskListProject, (doc) => {
      doc.addTask(myNewSubTask)
    })

    expect(callbackSpy).toHaveBeenCalledTimes(1)
    expect(mapperSpy).toHaveBeenCalledTimes(1)

    mutate(taskListProject, (doc) => {
      const myNewSubTask2 = new Task(`3213421451212`, 'Buy bread')
      myNewSubTask2.parentId = myNewTask.id

      doc.addTask(myNewSubTask2)
    })

    expect(callbackSpy).toHaveBeenCalledTimes(2)
    expect(mapperSpy).toHaveBeenCalledTimes(2)

    mutate(taskListProject, (doc) => {
      doc.tasks[myNewTask.id].checked = true
    })

    
    expect(callbackSpy).toHaveBeenCalledTimes(3)
    expect(mapperSpy).toHaveBeenCalledTimes(3)

  })
  
})
