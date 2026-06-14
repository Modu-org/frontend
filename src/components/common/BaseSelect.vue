<template>
  <div ref="wrapRef" class="base-select" :class="{ 'base-select--open': isOpen, 'base-select--disabled': disabled }">
    <button
      type="button"
      class="base-select__trigger"
      :disabled="disabled"
      @click.stop="toggle"
    >
      <span :class="['base-select__label', { 'base-select__label--placeholder': !selectedLabel }]">
        {{ selectedLabel || placeholder }}
      </span>
      <span class="material-symbols-outlined base-select__arrow">expand_more</span>
    </button>

    <Transition name="dropdown">
      <ul v-if="isOpen" class="base-select__list" @click.stop>
        <li
          v-if="placeholder"
          class="base-select__item base-select__item--placeholder"
          @click="select('')"
        >{{ placeholder }}</li>
        <li
          v-for="opt in options"
          :key="opt.value"
          :class="['base-select__item', { 'base-select__item--active': String(modelValue) === String(opt.value) }]"
          @click="select(opt.value)"
        >{{ opt.label }}</li>
      </ul>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '선택' },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'change'])

const wrapRef = ref(null)
const isOpen = ref(false)

const selectedLabel = computed(() => {
  const opt = props.options.find(o => String(o.value) === String(props.modelValue))
  return opt?.label || ''
})

function toggle() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function select(val) {
  emit('update:modelValue', val)
  emit('change', val)
  isOpen.value = false
}

function onClickOutside(e) {
  if (wrapRef.value && !wrapRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.base-select {
  position: relative;
  display: inline-flex;
  min-width: 0;
  flex: 1;
}

.base-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1.5px solid var(--color-outline-variant);
  border-radius: var(--radius-DEFAULT);
  background: #fff;
  color: var(--color-on-surface);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  white-space: nowrap;
  min-width: 0;
}
.base-select__trigger:hover:not(:disabled) {
  border-color: var(--color-primary);
}
.base-select--open .base-select__trigger {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(111, 143, 78, 0.15);
}
.base-select--disabled .base-select__trigger {
  opacity: 0.45;
  cursor: not-allowed;
}

.base-select__label {
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.base-select__label--placeholder {
  color: var(--color-outline);
}

.base-select__arrow {
  font-size: 1.15rem;
  color: var(--color-outline);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}
.base-select--open .base-select__arrow {
  transform: rotate(180deg);
}

/* Dropdown list */
.base-select__list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  max-height: 220px;
  overflow-y: auto;
  margin: 0;
  padding: 0.25rem 0;
  list-style: none;
  background: #fff;
  border: 1.5px solid var(--color-outline-variant);
  border-radius: var(--radius-DEFAULT);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.base-select__item {
  padding: 0.5rem 0.75rem;
  font-size: var(--font-size-sm);
  color: var(--color-on-surface);
  cursor: pointer;
  transition: background 0.12s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.base-select__item:hover {
  background: var(--color-surface-container-low);
}
.base-select__item--active {
  color: var(--color-primary);
  font-weight: 700;
  background: var(--color-primary-container);
}
.base-select__item--placeholder {
  color: var(--color-outline);
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
