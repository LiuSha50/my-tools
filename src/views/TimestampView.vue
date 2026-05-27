<template>
  <div class="tool-page">
    <nav class="breadcrumb">
      <router-link to="/">首页</router-link>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">时间戳转换</span>
    </nav>

    <h1 class="tool-title">⏱ 时间戳转换</h1>

    <!-- 第一行：当前时间信息 -->
    <section class="info-row">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">时间戳</span>
          <span class="info-value mono" @click="copyText(currentTsMs)">{{ currentTsMs }}</span>
          <span class="info-sub mono" @click="copyText(currentTsSec)">{{ currentTsSec }}s</span>
        </div>
        <div class="info-item">
          <span class="info-label">日期时间</span>
          <span class="info-value mono">{{ currentDateTime }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">农历</span>
          <span class="info-value">{{ currentLunar }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">第几周</span>
          <span class="info-value">第{{ currentWeek }}周</span>
        </div>
      </div>
    </section>

    <!-- 第二行：日期 → 时间戳 -->
    <section class="convert-row">
      <div class="convert-header">
        <span class="convert-title">日期 → 时间戳</span>
      </div>
      <div class="convert-body">
        <div class="convert-side">
          <input
            type="datetime-local"
            v-model="dateInput"
            class="convert-input"
            step="1"
          />
        </div>
        <div class="convert-arrow">→</div>
        <div class="convert-side">
          <input
            type="text"
            readonly
            :value="dateToTsResult"
            class="convert-output mono"
            @click="copyText(dateToTsResult)"
          />
          <div class="ts-unit-toggle">
            <button
              :class="['ts-unit-btn', { active: dateToTsUnit === 'milliseconds' }]"
              @click="dateToTsUnit = 'milliseconds'"
            >毫秒</button>
            <button
              :class="['ts-unit-btn', { active: dateToTsUnit === 'seconds' }]"
              @click="dateToTsUnit = 'seconds'"
            >秒</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 第三行：时间戳 → 日期 -->
    <section class="convert-row">
      <div class="convert-header">
        <span class="convert-title">时间戳 → 日期</span>
      </div>
      <div class="convert-body">
        <div class="convert-side">
          <input
            type="text"
            v-model="tsInput"
            class="convert-input mono"
            placeholder="输入时间戳"
          />
          <div class="ts-unit-toggle">
            <button
              :class="['ts-unit-btn', { active: tsToDateUnit === 'milliseconds' }]"
              @click="tsToDateUnit = 'milliseconds'"
            >毫秒</button>
            <button
              :class="['ts-unit-btn', { active: tsToDateUnit === 'seconds' }]"
              @click="tsToDateUnit = 'seconds'"
            >秒</button>
          </div>
        </div>
        <div class="convert-arrow">→</div>
        <div class="convert-side">
          <input
            type="text"
            readonly
            :value="tsToDateResult"
            class="convert-output mono"
            @click="copyText(tsToDateResult)"
          />
          <select v-model="tzOffset" class="tz-select-input">
            <option v-for="tz in timezoneOptions" :key="tz.value" :value="tz.value">
              {{ tz.label }}
            </option>
          </select>
        </div>
      </div>
    </section>

    <div v-if="copied" class="copy-toast">已复制</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  getWeekNumber,
  getLunarDate,
  formatDateTime,
  timestampToDate,
  dateToTimestamp,
} from '../tools/text/timestampUtils.js'

let timer = null
const now = ref(new Date())
const copied = ref(false)
let copyTimer = null

// 第二行状态
const dateInput = ref('')
const dateToTsUnit = ref('milliseconds')

// 第三行状态
const tsInput = ref(String(Date.now()))
const tsToDateUnit = ref('milliseconds')
const tzOffset = ref(8)

const timezoneOptions = [
  { value: -12, label: 'UTC-12' },
  { value: -11, label: 'UTC-11' },
  { value: -10, label: 'UTC-10' },
  { value: -9, label: 'UTC-9' },
  { value: -8, label: 'UTC-8' },
  { value: -7, label: 'UTC-7' },
  { value: -6, label: 'UTC-6' },
  { value: -5, label: 'UTC-5' },
  { value: -4, label: 'UTC-4' },
  { value: -3, label: 'UTC-3' },
  { value: -2, label: 'UTC-2' },
  { value: -1, label: 'UTC-1' },
  { value: 0, label: 'UTC+0' },
  { value: 1, label: 'UTC+1' },
  { value: 2, label: 'UTC+2' },
  { value: 3, label: 'UTC+3' },
  { value: 4, label: 'UTC+4' },
  { value: 5, label: 'UTC+5' },
  { value: 5.5, label: 'UTC+5:30' },
  { value: 6, label: 'UTC+6' },
  { value: 7, label: 'UTC+7' },
  { value: 8, label: 'UTC+8' },
  { value: 9, label: 'UTC+9' },
  { value: 10, label: 'UTC+10' },
  { value: 11, label: 'UTC+11' },
  { value: 12, label: 'UTC+12' },
]

// 第一行：当前时间信息
const currentTsMs = computed(() => now.value.getTime())
const currentTsSec = computed(() => Math.floor(now.value.getTime() / 1000))
const currentDateTime = computed(() => formatDateTime(now.value))
const currentLunar = computed(() => getLunarDate(now.value).toString())
const currentWeek = computed(() => getWeekNumber(now.value))

// 第二行：日期 → 时间戳
const dateToTsResult = computed(() => {
  if (!dateInput.value) return ''
  try {
    return dateToTimestamp(dateInput.value, {
      timezoneOffset: tzOffset.value,
      unit: dateToTsUnit.value,
    })
  } catch {
    return '无效日期'
  }
})

// 第三行：时间戳 → 日期
const tsToDateResult = computed(() => {
  if (!tsInput.value) return ''
  const num = Number(tsInput.value.trim())
  if (isNaN(num)) return '无效时间戳'
  try {
    return timestampToDate(num, {
      timezoneOffset: tzOffset.value,
      unit: tsToDateUnit.value,
    }).formatted
  } catch {
    return '无效时间戳'
  }
})

function formatForDatetimeLocal(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function tick() {
  now.value = new Date()
}

function copyText(text) {
  if (!text) return
  navigator.clipboard.writeText(String(text))
  copied.value = true
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copied.value = false }, 1500)
}

onMounted(() => {
  tick()
  dateInput.value = formatForDatetimeLocal(now.value)
  timer = setInterval(tick, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
  clearTimeout(copyTimer)
})
</script>

<style scoped>
.breadcrumb {
  font-size: 13px;
  margin-bottom: calc(var(--spacing-unit) * 2);
}
.breadcrumb a {
  color: var(--color-primary);
  text-decoration: none;
}
.breadcrumb a:hover {
  text-decoration: underline;
}
.breadcrumb-sep {
  margin: 0 6px;
  color: var(--color-text-secondary);
}
.breadcrumb-current {
  color: var(--color-text-secondary);
}
.tool-title {
  font-size: 22px;
  font-weight: 500;
  margin-bottom: calc(var(--spacing-unit) * 3);
}

/* 第一行：信息展示 */
.info-row {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: calc(var(--spacing-unit) * 2);
  margin-bottom: calc(var(--spacing-unit) * 2);
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: calc(var(--spacing-unit) * 2);
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.info-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.info-value {
  font-size: 15px;
  font-weight: 500;
  cursor: default;
}
.info-sub {
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: default;
}
.mono {
  font-family: var(--font-mono);
}

/* 第二、三行：转换行 */
.convert-row {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: calc(var(--spacing-unit) * 2);
  margin-bottom: calc(var(--spacing-unit) * 2);
}
.convert-header {
  margin-bottom: calc(var(--spacing-unit) * 1.5);
}
.convert-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}
.convert-body {
  display: flex;
  align-items: flex-start;
  gap: calc(var(--spacing-unit) * 2);
}
.convert-side {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.convert-arrow {
  font-size: 18px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  padding-top: 6px;
}
.convert-input,
.convert-output {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  outline: none;
  background: var(--color-surface);
  color: var(--color-text);
}
.convert-input:focus {
  border-color: var(--color-primary);
}
.convert-output {
  background: var(--color-bg);
  cursor: pointer;
}

/* 时间戳单位切换 */
.ts-unit-toggle {
  display: flex;
  flex-shrink: 0;
}
.ts-unit-btn {
  padding: 6px 10px;
  font-size: 11px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.ts-unit-btn:first-child {
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
  border-right: none;
}
.ts-unit-btn:last-child {
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
.ts-unit-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

/* 时区选择 */
.tz-select-input {
  flex-shrink: 0;
  padding: 6px 8px;
  font-size: 11px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  outline: none;
}
.tz-select-input:focus {
  border-color: var(--color-primary);
}

/* 复制提示 */
.copy-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-text);
  color: white;
  padding: 6px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  z-index: 100;
}

@media (max-width: 640px) {
  .convert-body {
    flex-direction: column;
  }
  .convert-arrow {
    transform: rotate(90deg);
  }
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>