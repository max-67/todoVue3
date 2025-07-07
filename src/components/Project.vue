<template>
  <div 
    @click="hideCreateTask()"
    v-if="showNewTask" class="h-full w-full absolute top-0 left-0 bg-[rgba(210,210,210,0.5)] z-50"
  ></div>
  <div class="bg-white rounded shadow p-4 w-100 shrink-0 flex flex-col">
    <!-- Заголовок проекта -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">{{ project.name }}</h2>
      <button
        @click="removeProject(project.id)"
        class="text-red-500 hover:text-red-700 cursor-pointer"
        title="Удалить проект"
      >
        ✕
      </button>
    </div>

    <!-- Форма добавления задачи -->
    <div class="flex mb-4 relative">
      <input
        @focus="showCreateTask"
        v-model="newTask.title"
        type="text"
        placeholder="Новая задача..."
        class="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        :class='{ "z-100": showNewTask === project.id }'
        @keydown.enter.prevent="addTask()"
      />
      <div v-if="showNewTask === project.id" class="flex flex-col gap-2.5 p-2.5 bg-white z-70 absolute m-[-10px] rounded-[10px] overflow-hidden w-[388px] task-anim">
        <div class="h-[42px] flex-shrink-0"></div>
        <div>
          <select v-model="newTask.status" class="w-full px-2 py-2 border border-gray-300 rounded bg-white" name="" id="">
            <option class="text-gray-200" :value="status" v-for="status of availableStatuses" :key="status" >{{status}}</option>
          </select>
        </div>
        <div class="flex flex-wrap gap-x-[0.5rem] gap-y-[0.25rem] text-sm text-gray-600">
          <span v-for="tag in newTask.tags" :key="tag" class="mb-2 bg-gray-200 px-[0.5rem] py-[0.15rem] rounded-full">
            {{ tag }} <button class="hover:font-bold cursor-pointer text-red-400 text-xs" style="font-size: 12px;" @click="removeTagFromNewTask(tag)">✕</button>
          </span>
        </div>
        <div class="flex">
          <input
            v-model="newTag"
            type="text"
            placeholder="добавить тэг"
            class="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 w-full bg-white"
            @keydown.enter.prevent="addTag()"
          />
          <button class="text-green-500 hover:text-green-700" @click="addTag()">
            <svg  xmlns="http://www.w3.org/2000/svg" class=" cursor-pointer h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="4,4 20,12 4,20" />
            </svg>
          </button>
        </div>
        
        <button
          @click="addTask()"
          class="px-3 py-2 w-full bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer"
        >
          Создать
        </button>
      </div>
    </div>

    <!-- Задачи проекта -->
    <div class="overflow-y-auto overflow-hidden">
      <Task 
        v-for="task in project.tasks"
        :key="task.id"
        :task="task"
        :availableStatuses="availableStatuses"
        :projectId="project.id"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import { IProject, ITask } from './../types/types.ts';
  import Task from './Task.vue';

  const props = defineProps<{
    project: IProject,
    availableStatuses: string[]
  }>();

  const emit = defineEmits([
    'removeProject',
    'addTask',
  ]);

  // Используется для новой задачи.
  const showNewTask = ref<string>('');
  const newTask = reactive<ITask>({
    id: '',
    title: '',
    status: 'todo',
    tags: [],
    subtasks: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // используется для нового тэга.
  const newTag = ref<string>('');

  /**
   * Очищение данных новой задачи.
   */
  const resetNewTask = () => {
    newTask.id = '';
    newTask.title = '';
    newTask.status = 'todo';
    newTask.tags = [];
    newTask.subtasks = [];
    newTask.createdAt = new Date();
    newTask.updatedAt = new Date();
  }

  /**
   * Скрытие формы создания новой задачи.
   */
  const hideCreateTask = (): void => {
    resetNewTask();
    showNewTask.value = '';
  }

  /**
   * Удаление проекта.
   * @param projectId Идентифкатор проекта.
   */
  const removeProject = (projectId: string): void => {
    if (confirm('Вы действительно хотите удалить проект?')) {
      emit('removeProject', projectId);
    }
  }

  /**
   * Добавление задачи в проект.
   */
  const addTask = (): void => {
    emit('addTask', props.project.id, newTask);
    showNewTask.value = '';
    resetNewTask();
  }

  /**
   * Удаление тэга из новой задачи.
   * @param tagValue Тэг.
   */
  const removeTagFromNewTask = (tagValue: string): void => {
    newTask.tags.splice(newTask.tags.indexOf(tagValue), 1);
  }

  /**
   * Отображение формы создания новой задачи.
   */
  const showCreateTask = (): void => {
    if (showNewTask.value) return;
    newTask.tags = [];
    newTag.value = '';
    showNewTask.value = props.project.id;
  }

  /**
   * Добавление нового тэга.
   */
  const addTag = (): void => {
    newTask.tags.push(newTag.value);
    newTag.value = '';
  }
</script>

<style scoped>
  .task-anim {
    animation: expand .4s linear forwards;
  }

  @keyframes expand {
    0% {
      max-height: 0;
      top: 0;
    }
    100% {
      max-height: 394px;
    }
  }
</style>