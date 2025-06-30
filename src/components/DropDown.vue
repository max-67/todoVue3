<template>
  <div ref="containerRef" class="relative">
    <!-- Кнопка -->
    <button
      @click="isOpen = !isOpen"
      class="w-full text-gray-400 border px-2 border-gray-300 rounded h-[40px] text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:text-gray-600"
    >
      {{ selectedItems.length > 0 ? selectedItems.join(', ') : text }}
      <span class="float-right">▼</span>
    </button>

    <!-- Выпадающий список -->
    <div
      v-if="isOpen"
      class="absolute left-0 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto z-10"
    >
      <div
        v-for="item in items"
        :key="item"
        class="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
        @click="toggle($event, item)"
      >
        <input
          type="checkbox"
          :id="'checkbox-' + item"
          :value="item"
          v-model="selectedItems"
          class="mr-2 accent-blue-500"
        />
        <label :for="'checkbox-' + item" class="cursor-pointer">{{ item }}</label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';

  defineProps<{
    items: string[],
    text: string
  }>();

  const emit = defineEmits(['update']);

  const containerRef = ref<HTMLElement | null>(null);
  const isOpen = ref(false);
  const selectedItems = ref<string[]>([]);

  const toggle = (e: Event, item: string): void => {
    e.preventDefault();
    const index: number = selectedItems.value.indexOf(item);
    if (index === -1) {
      selectedItems.value.push(item);
    } else {
      selectedItems.value.splice(index, 1);
    }
    emit('update', selectedItems);
  }

  // Обработчик клика по документу для закрытия dropdown при клике вне
  const handleClickOutside = (event: MouseEvent): void => {
    if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
      isOpen.value = false;
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
  });
</script>