<template>
  <div
    class="border border-gray-200 rounded p-3 mb-2 shadow-sm"
  >
    <!-- Статус задачи -->
    <div class="flex mb-2 items-start justify-between">
      <!-- Время -->
      <span>
        {{getTaskDate() }}
      </span>
      <!-- Статус переключатель -->
      <div class="flex gap-2">
        <select
          v-model="task.status"
          @change="updateTimestamp()"
          class="px-2 py-[0.25rem] max-w-[120px] text-gray-400 focus-visible:outline-none text-right"
        >
          <option v-for="tag in availableStatuses" :value=tag >{{ tag }}</option>
        </select>
        <!-- Удаление задачи -->
        <button
          @click="removeTask()"
          class="text-red-500 hover:text-red-700 ml-auto cursor-pointer"
          title="Удалить задачу"
        >
          ✕
        </button>
      </div>
    </div>
    <div class="text-left">
      <!-- Название задачи -->
      <span v-if="!isEditTitle" :class="{ 'line-through text-gray-500': task.status === 'done' }" @click="getEditTitle()">
        {{ task.title }}
      </span>
      <div v-else>
        <input v-model="editTitle" type="text" ref="editTitleInput">
        <button @click="saveNewTitle()" class="text-green-500 cursor-pointer text-base hover:text-green-600 mr-2 ml-1">✓</button>
        <button @click="cancelEditTitle()" class="text-red-500 cursor-pointer text-lg hover:text-red-600">×</button>
      </div>
    </div>

    <!-- Теги -->
    <div class="mb-2 flex flex-wrap gap-x-[0.5rem] gap-y-[0.25rem] text-sm text-gray-600">
      <span v-for="tag in task.tags" :key="tag" class="bg-gray-200 px-[0.5rem] py-[0.15rem] rounded-full">
        {{ tag }} <button class="hover:font-bold cursor-pointer text-red-400 text-xs" style="font-size: 12px;" @click="removeTagFromTask(tag)">✕</button>
      </span>
      <span @click="getAddTag()" class="bg-gray-200 px-[8px] py-[2px] rounded-full flex items-center h-[24px] hover:bg-gray-300 cursor-pointer">
        <template v-if="!isAddTag">
          <button  class="cursor-pointer">+</button>
        </template>
        <template v-else>
          <input ref="editTagInput" type="text" class="w-[50px] h-[20px]" v-model="addTagText">
          <button @click="addTag($event)" class="text-green-500 cursor-pointer text-base hover:text-green-600 mr-2 ml-1">✓</button>
          <button @click="cancelAddTag($event)" class="text-red-500 cursor-pointer text-lg hover:text-red-600">×</button>
        </template>
      </span>
    </div>

    <!-- Подзадачи -->
    <div v-if="task.subtasks.length > 0" class="ml-1 mb-[0.5rem]">
      <ul>
        <li
          v-for="subtask in task.subtasks"
          :key="'sub-' + subtask.id"
          class="-mb-px border-l border-b border-gray-200 pl-[0.75rem] overflow-auto text-gray-500 text-left"
        >
          {{ subtask.title }}
        </li>
      </ul>
    </div>

    <!-- Добавление подзадачи -->
    <div class="flex gap-2">
      <input
        class="w-full ml-1"
        v-model="newSubtaskTitle"
        type=text
        placeholder="Подзадача..."
        @keydown.enter.prevent="$emit('addSubtask', task.id)"
        @input="(e) => newSubtaskTitle = (e.target as HTMLInputElement).value"
        ref="'subInput-' + task.id"
        :ref="'subInput-' + task.id"
        @keyup.enter="$emit('addSubtask', task.id)"
      />
      <button
        @click="addSubtask()"
        class='ml-auto px=2 py=1 bg-gray=300 rounded cursor-pointer text-2xl text-green-600 hover:text-green-700'
      >
        +
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, nextTick } from 'vue';
  import { ITask } from './../types/types.ts';

  const props = defineProps<{
    task: ITask,
    availableStatuses: string[],
    projectId: string
  }>();

  const emit = defineEmits([
    'removeTask', 
    'addSubtask', 
    'updateTimestamp', 
    'removeTagFromTask', 
    'addTag', 
    'saveNewTitle'
  ]);

  const editTitleInput = ref<HTMLInputElement | null>(null);
  const newSubtaskTitle = ref<string>('');

  const editTagInput = ref<HTMLInputElement | null>(null);
  const isAddTag = ref<boolean>(false);
  const addTagText = ref<string>('');

  const isEditTitle = ref<boolean>(false);
  const editTitle = ref<string>('');

  /**
   * Сохранение нового наименования задачи.
   */
  const saveNewTitle = (): void => {
    emit('saveNewTitle', editTitle, props.task.id);
    isEditTitle.value = false;
  }

  /**
   *  Добавление подзадачи к задаче внутри проекта.
   */
  const addSubtask = (): void => {
    emit('addSubtask', props.task.id, newSubtaskTitle.value);
    newSubtaskTitle.value = '';
  }

  /**
   * Удаление тэга из задачи.
   * @param tag Тэг.
   */
  const removeTagFromTask = (tag: string): void => {
    emit('removeTagFromTask', tag, props.task.id);
  }

  /**
   * Удаление задачи из проекта.
   */
  const removeTask = (): void => {
    if (confirm('Вы действительно хотите удалить задачу?')) {
      emit('removeTask', props.task.id);
    }
  }

  /**
   * Добавление нового тэга к задаче.
   * @param e Событие.
   */
  const addTag = (e: Event): void => {
    e.stopPropagation();
    emit('addTag', addTagText.value, props.task.id);
    isAddTag.value = false;
  }

  /**
   * Отмена добавления нового тэга к задаче.
   * @param e Событие.
   */
  const cancelAddTag = (e: Event): void => {
    e.stopPropagation();
    isAddTag.value = false;
  }

  /**
   * Редактирование нового тэга для задачи.
   */
  const getAddTag = (): void => {
    addTagText.value = '';
    isAddTag.value = true;
    nextTick(() => {
      if (editTagInput.value) {
          editTagInput.value.focus();
        }
    })
  } 

  /**
   *  Редактирование заголовка задачи. 
   */
  const getEditTitle = (): void => {
    editTitle.value = props.task.title;
    isEditTitle.value = true;
    nextTick(() => {
      if (editTitleInput.value) {
          editTitleInput.value.focus();
        }
    })
  }

  /**
   * Отмена редактирования заголовка задачи.
   */
  const cancelEditTitle = (): void => {
    isEditTitle.value = false;
  }

  /**
   * Обновление времени при смене статуса задачи.
   */
  const updateTimestamp = (): void => {
    emit('updateTimestamp', new Date(), props.task.id);
  }

  /**
   * Получение форматированной даты у задачи.
   */
  const getTaskDate = (): string => {
    if (props.task.updatedAt) {
      const date: Date = new Date(props.task.updatedAt);
      return `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${date.toLocaleDateString()}`
    }
    if (props.task.createdAt) {
      const date: Date = new Date(props.task.createdAt);
      return `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${date.toLocaleDateString()}`
    }
    return 'Нет данных';
  }
</script>