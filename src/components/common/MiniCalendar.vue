<template>
  <div class="cal-wrap">
    <div class="cal-nav">
      <button class="cal-nav-btn" @click="prevMonth" aria-label="이전 달">
        <span class="material-symbols-outlined">chevron_left</span>
      </button>
      <span class="cal-month-label">{{ year }}년 {{ month + 1 }}월</span>
      <button class="cal-nav-btn" @click="nextMonth" aria-label="다음 달">
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
    </div>

    <div class="cal-grid">
      <div v-for="d in DAYS" :key="d" class="cal-head">{{ d }}</div>
      <div v-for="blank in startBlank" :key="'b' + blank" class="cal-cell cal-cell--blank"></div>
      <button
        v-for="day in daysInMonth"
        :key="day"
        :class="['cal-cell', {
          'cal-cell--today': isToday(day),
          'cal-cell--selected': isSelected(day),
          'cal-cell--disabled': isDisabled(day),
        }]"
        :disabled="isDisabled(day)"
        @click="select(day)"
      >{{ day }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  minDate: { type: String, default: null },
})
const emit = defineEmits(['select'])

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const today = new Date()
const year = ref(today.getFullYear())
const month = ref(today.getMonth())
const selectedDay = ref(null)

const daysInMonth = computed(() => new Date(year.value, month.value + 1, 0).getDate())
const startBlank = computed(() => new Date(year.value, month.value, 1).getDay())

function prevMonth() {
  if (month.value === 0) { month.value = 11; year.value-- } else month.value--
  selectedDay.value = null
}
function nextMonth() {
  if (month.value === 11) { month.value = 0; year.value++ } else month.value++
  selectedDay.value = null
}

function pad(n) { return String(n).padStart(2, '0') }
function dateStr(day) { return `${year.value}-${pad(month.value + 1)}-${pad(day)}` }

function isToday(day) {
  return year.value === today.getFullYear() && month.value === today.getMonth() && day === today.getDate()
}
function isSelected(day) { return selectedDay.value === day }
function isDisabled(day) {
  if (!props.minDate) return false
  return dateStr(day) < props.minDate
}
function select(day) {
  selectedDay.value = day
  emit('select', dateStr(day))
}
</script>

<style scoped>
.cal-wrap { background: var(--color-surface); padding: 0.875rem; }
.cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.625rem; }
.cal-month-label { font-size: var(--font-size-body); font-weight: 700; color: var(--color-on-surface); }
.cal-nav-btn { background: none; border: none; cursor: pointer; color: var(--color-on-surface); display: flex; align-items: center; padding: 0.25rem; border-radius: var(--radius-sm); }
.cal-nav-btn:hover { background: var(--color-surface-container-low); }

.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.25rem; }
.cal-head { text-align: center; font-size: var(--font-size-xs); font-weight: 700; color: var(--color-on-surface-variant); padding: 0.25rem 0; }
.cal-cell {
  aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
  border-radius: 50%; font-size: var(--font-size-sm); color: var(--color-on-surface);
  background: none; border: none; cursor: pointer; transition: background 0.13s;
}
.cal-cell:hover:not(:disabled) { background: var(--color-surface-container-high); }
.cal-cell--today { font-weight: 700; color: var(--color-primary); border: 1.5px solid var(--color-primary); }
.cal-cell--selected { background: var(--color-primary) !important; color: var(--color-on-primary) !important; font-weight: 700; border: none; }
.cal-cell--disabled { color: var(--color-outline); cursor: not-allowed; opacity: 0.4; }
</style>
