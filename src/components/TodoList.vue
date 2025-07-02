<template>
  <div class=" bg-gray-100 p-4 flex flex-col items-center w-full">
    <h1 class="text-3xl font-bold mb-6">Проектная доска</h1>
    <div class="flex flex-col gap-2 w-max-[400px]">
      <div class="flex gap-1 flex-wrap">
        <!-- Форма добавления проекта -->
        <div class="flex flex-col border border-gray-400 p-4 pt-3 rounded-2xl">
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Новый проект</h3>
          <div class="">
            <div class="flex space-x-1 justify-center">
              <input
                v-model="newProjectName"
                type="text"
                placeholder="Название проекта"
                class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                @click="addProject"
                class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
              >
                Создать
              </button>
            </div>
          </div>
        </div>


        <!-- Импорт\экспорт -->
        <div class="flex flex-col border border-gray-400 p-4 pt-3 rounded-2xl">
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Импорт / экспорт</h3>
          <div class="flex gap-1 justify-center">
            <button @click="exportToToken()" class="px-4 bg-blue-300 text-black rounded hover:bg-blue-400 cursor-pointer">Экспорт</button>
            <label class="cursor-pointer inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Импорт
              <input @change="importFromToken($event)" type="file" class="hidden" />
            </label>
          </div>
        </div>
      </div>

      <!-- Фильтрация и поиск -->
      <div class="w-full flex flex-col border border-gray-400 p-4 pt-3 rounded-2xl">
        <h3 class="text-xl font-semibold text-gray-800 mb-2">Фильтрация</h3>
        <div class="flex gap-1">
          <input v-model="search" class="text-gray-400 w-full border px-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 focus:text-gray-600" type="text" placeholder="Поиск...">
          <DropDown class="w-full" text="Тэги" :items=availableTags @update="changeTags" />
          <DropDown class="w-full" text="Статусы" :items=availableStatuses @update="changeStatus" />
        </div>
      </div>
    </div>

    <!-- Список проектов -->
    <div class="p-4 flex gap-3 overflow-x-auto w-full h-full">
      <Project 
        v-for="project in filteredProjects"
        :key="project.id"
        :project="project"
        :availableStatuses="availableStatuses"
        @removeProject="removeProject"
        @addTask="addTask"
      />
    </div>
  </div>
</template>

<script setup lang='ts'>
  import { ref, Ref,  watch, computed, provide } from 'vue';
  import CryptoJS from 'crypto-js';
  import DropDown from './DropDown.vue';
  import { ITask, IProject, ISettings } from './../types/types.ts';
  import Project from './Project.vue';

  const availableTags = ref<string[]>([]);
  const availableStatuses = ref<string[]>([]);

  // Фильтры и поиск.
  const search = ref<string>('');
  const selectedTags = ref<string[]>([]);
  const selectedStatuses = ref<string[]>([]);

  // Основной массив проектов.
  const projects = ref<IProject[]>([]);

  // Для создания новых проектов и задач (просто для примера).
  const newProjectName = ref<string>('');
  const showNewTask = ref<string>('');

  /**
   * Удаление задачи из проекта по id проекта и задачи.
   * @param projectId Идентификатор проекта.
   * @param taskId Идентификатор задачи.
   */
  const removeTask = (projectId: string, taskId: string): void => {
    const project: IProject | undefined = projects.value.find((p): boolean => p.id === projectId);
    if (!project) return;
    
    project.tasks = project.tasks.filter(t => t.id !== taskId);
  }

  provide('removeTask', removeTask);

  /**
   * Удаление тэга по его имени из задачи.
   * @param tag Текст тэга.
   * @param taskId Идентификатор задачи.
   * @param projectId Идентификатор проекта.
   */
  const removeTagFromTask = (tag: string, taskId: string, projectId: string): void => {
    const project: IProject | undefined = projects.value.find((p): boolean => p.id === projectId);
    if (!project) return;

    const task: ITask | undefined = project.tasks.find((t): boolean => t.id === taskId);
    if (!task) return;

    task.tags.splice(task.tags.indexOf(tag), 1);
  }

  provide('removeTagFromTask', removeTagFromTask);

  /**
   * Изменение наименования задачи.
   * @param newTitle Новое наименование задачи.
   * @param taskId Идентификатор задачи.
   * @param projectId Идентификатор проекта.
   */
  const saveNewTitle = (newTitle: string, taskId: string, projectId:string): void => {
    const project: IProject | undefined = projects.value.find((p): boolean => p.id === projectId);
    if (!project) return;

    const task: ITask | undefined = project.tasks.find((t): boolean => t.id === taskId);
    if (!task) return;

    task.title = newTitle;
  }

  provide('saveNewTitle', saveNewTitle);

  /**
   * Добавление подзадачи к задаче внутри проекта по id проекта и задачи
   * @param projectId Идентификатор проекта.
   * @param taskId Идентификатор задачи.
   * @param newSubtaskTitle Новое название подзадачи.
   */
  const addSubtask = (projectId: string, taskId: string, newSubtaskTitle: string): void => {
    const project: IProject | undefined = projects.value.find((p): boolean => p.id === projectId);
    if (!project) return;

    const task: ITask | undefined = project.tasks.find((t): boolean => t.id === taskId);
    if (!task || !newSubtaskTitle || !newSubtaskTitle.trim()) return;

    const subtask: ITask = {
      id: Date.now().toString(),
      title: newSubtaskTitle.trim(),
      status: 'in-progress',
      tags: [],
      subtasks: [],
      createdAt:new Date(),
      updatedAt:new Date()
    };

    // Добавляем подзадачу к текущей задаче 
    task.subtasks.push(subtask);
  }

  provide('addSubtask', addSubtask);

  /**
   * Добавление задачи в проект по id проекта.
   * @param projectId Идентификатор проекта.
   * @param taskTitle Наименование задачи.
   * @param taskStatus Статус задачи.
   * @param taskTags Тэги, прикрепленные к задаче.
   */
  const addTask = (projectId: string, taskTitle: string, taskStatus: string, taskTags: string[]): void => {
    const project: IProject | undefined = projects.value.find((p): boolean => p.id === projectId);
    if (!project || !taskTitle.trim()) return;

    const newTask: ITask = {
      id: Date.now().toString(),
      title: taskTitle.trim(),
      status: taskStatus,
      tags: taskTags || [],
      subtasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    project.tasks.unshift(newTask);
    
    showNewTask.value = '';
  }

  /**
   * Добавление тэга к задаче.
   * @param tag Текст тэга.
   * @param taskId Идентификатор задачи.
   * @param projectId Идентификатор проекта.
   */
  const addTag = (tag: string, taskId: string, projectId: string): void => {
    const project: IProject | undefined = projects.value.find((p): boolean => p.id === projectId);
    if (!project) return;

    const task: ITask | undefined = project.tasks.find((t): boolean => t.id === taskId);
    if (!task) return;

    task.tags.push(tag);
  }

  provide('addTag', addTag);

  /**
   * Получение доступных статусов задач.
   */
  const getAvailableStatuses = (): void => {
    availableStatuses.value = ['todo', 'in-progress', 'done'];
  }

  /**
   * Удаление проекта.
   * @param projectId Идентификатор проекта.
   */
  const removeProject = (projectId: string): void => {
    projects.value = projects.value.filter(p => p.id !== projectId);
  }

  /**
   * Получение достпуных тэгов задач.
   */
  const getAvailableTags = (): void => {
    availableTags.value = Array.from(
      new Set(
        projects.value.flatMap(project => 
          project.tasks.flatMap(task => task.tags)
        )
      )
    );
  }

  /**
   * Изменение выбранных тэгов.
   * @param data Массив выбранных тэгов.
   */
  const changeTags = (data: Ref<string[]>): void => {
    selectedTags.value = data.value;
  }

  /**
   * Изменение выбранных статусов.
   * @param data Массив выбранных статусов.
   */
  const changeStatus = (data: Ref<string[]>): void => {
    selectedStatuses.value = data.value;
  }

  /**
   * Загружает данные из local storage.
   */
  const loadFromLocalStorage = (): void => {
    try {
      const stringSettings: string | null = localStorage.getItem('todo_app_data');
      if (!stringSettings) return;
      const settings: ISettings = JSON.parse(stringSettings);

      projects.value = settings?.projects || [];
      search.value = settings?.filters.search || '';
      selectedStatuses.value = settings?.filters.statuses || [];
      selectedTags.value = settings?.filters.tags || [];
      getAvailableTags();
    } catch (_) {
    }
  }

  /**
   * Обновляет данные в local Storage.
   */
  const updateLocalStorage = (): void => {
    localStorage.setItem('todo_app_data', JSON.stringify({
      projects: projects.value,
      filters: {
        statuses: selectedStatuses.value,
        tags: selectedTags.value,
        search: search.value
      }
    }));
  }

  /**
   * Экспортирует данные в файл.
   */
  const exportToToken = (): void => {
    if (!projects.value || !Array.isArray(projects.value)) return;

    const secretKey: string | null = prompt("Введите секретный ключ для шифрования:");

    const jsonString: string = JSON.stringify(projects.value);
    const encrypted: string = CryptoJS.AES.encrypt(jsonString, secretKey).toString();

    const blob: Blob = new Blob([encrypted], { type: 'text/plain' });

    const url: string = URL.createObjectURL(blob);

    const a: HTMLAnchorElement = document.createElement('a');
    a.href = url;
    a.download = `projects_${new Date().toLocaleTimeString}_${new Date().toLocaleDateString}.txt`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Проверяет ялвяется ли объект подобным ITask.
   * @param obj Объект.
   */
  const isTask = (obj: any): ITask => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof obj.id === 'string' &&
      typeof obj.title === 'string' &&
      (obj.status === 'todo' || obj.status === 'in-progress' || obj.status === 'done') &&
      Array.isArray(obj.tags) && obj.tags.every((tag: any) => typeof tag === 'string') &&
      Array.isArray(obj.subtasks) && obj.subtasks.every(isTask) &&
      (obj.createdAt instanceof Date || (typeof obj.createdAt === 'string' && !isNaN(Date.parse(obj.createdAt)))) &&
      (obj.updatedAt instanceof Date || (typeof obj.updatedAt === 'string' && !isNaN(Date.parse(obj.updatedAt)))) &&
      // newSubtaskTitle — необязательное свойство
      (typeof obj.newSubtaskTitle === 'undefined' || typeof obj.newSubtaskTitle === 'string')
    );
  }

  /**
   * Проверяет ялвяется ли объект подобным IProject.
   * @param obj Объект.
   */
  const isProject = (obj: any): IProject => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof obj.id === 'string' &&
      typeof obj.name === 'string' &&
      Array.isArray(obj.tasks) && 
      obj.tasks.every(isTask)
    );
  }

  /**
   * Импортирует данные из загруженног файла.
   * @param event Событие.
   */
  const importFromToken = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    if (!target.files) return;
    if (target.files && target.files.length > 1) {
      alert('Выбрано более 1 файла! Пожалуйста, выберите 1 файл.');
      target.value = '';
      return;
    }

    const secretKey: string | null = prompt("Введите секретный ключ для дешифрования:");

    const file: File = target.files[0];
    const reader = new FileReader();
    // Обработчик завершения чтения
    reader.onload = () => {
      const content = reader.result; // содержимое файла
      try {
        // Расшифровка
        const bytes = CryptoJS.AES.decrypt(content, secretKey);
        const decryptedJsonString = bytes.toString(CryptoJS.enc.Utf8);
        const decryptedData = JSON.parse(decryptedJsonString);

        // Проходим валидацию, что json содержит правильные данные, соответсвующие интерфейсам.
        for (const elem of decryptedData) {
          if (!isProject(elem)) {
            alert('Файл поврежден');
            return;
          }
        }

        if (confirm('Файл успешно загружен. Вы действительно хотите обновить проектную доску?')) {
          // Применяем данные.
          projects.value = decryptedData;
        } else {

        }
        // Очищаем инпут.
        target.value = '';
      } catch(_) {
        alert('Ошибка чтения файла');
      }
    }
    reader.readAsText(file);  
  }

  /**
   * Добавление нового проекта.
   */
  const addProject = (): void => {
    if (!newProjectName.value.trim()) return;
    projects.value.push({
      id: Date.now().toString(),
      name: newProjectName.value.trim(),
      tasks: []
    });
    newProjectName.value = '';
    updateLocalStorage();
  }

  /**
   * Обновление времени при смене статуса.
   * @param projectId Идентификатор проекта.
   * @param taskId Идентификатор задачи.
   * @param date Дата.
   */
  const updateTimestamp = (projectId: string, taskId: string, date: Date): void => {
    const project: IProject | undefined = projects.value.find((project) => project.id === projectId);
    if (project) {
     const task: ITask | undefined = project.tasks.find((task) => task.id === taskId);
     if (task) task.updatedAt = date;
    }
  }

  provide('updateTimestamp', updateTimestamp);

  /**
   * Вычисляемое свойство для фильтрации проектов.
   */
  const filteredProjects = computed<IProject[]>(() => {
    const lowerSearch: string = search.value.toLowerCase();

    return projects.value
      .map((project): IProject => {
        // фильтрация задач внутри проекта
        const filteredTasks: ITask[] = project.tasks.filter((task): boolean => {
          // 1. Поиск по title
          const matchesTitle: boolean = task.title.toLowerCase().includes(lowerSearch);

          // 2. По тегам (если выбраны)
          const matchesTags: boolean =
            selectedTags.value.length === 0 ||
            task.tags.some(tag => selectedTags.value.includes(tag));

          // 3. По статусу (если выбран)
          const matchesStatus: boolean =
            selectedStatuses.value.length === 0 ||
            selectedStatuses.value.includes(task.status);
          return matchesTitle && matchesTags && matchesStatus;
        });
        return {
          ...project,
          tasks: filteredTasks,
        };
      })
  });

  /**
   * Слежение за изменением проектов и фильтрации.
   */
  watch([projects, search, selectedStatuses, selectedTags], () => {
      updateLocalStorage();
      getAvailableTags();
  }, { deep: true });

  loadFromLocalStorage();
  getAvailableStatuses();
</script>