import { Solar } from 'lunar-javascript'

export function getLunarDate(date) {
  const solar = Solar.fromDate(date)
  const lunar = solar.getLunar()
  return {
    year: lunar.getYear(),
    month: lunar.getMonth(),
    day: lunar.getDay(),
    isLeapMonth: lunar.getMonth() < 0,
    yearGanZhi: lunar.getYearInGanZhi(),
    monthName: lunar.getMonthInChinese(),
    dayName: lunar.getDayInChinese(),
    toString() {
      return `${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`
    },
  }
}

export function getWeekNumber(date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((date - startOfYear) / 86400000) + 1
  const dayOfWeek = startOfYear.getDay() || 7
  return Math.ceil((dayOfYear + dayOfWeek - 1) / 7)
}

export function formatDateTime(date, options = {}) {
  const { timezoneOffset } = options
  const pad = n => String(n).padStart(2, '0')
  if (timezoneOffset !== undefined) {
    const targetMs = date.getTime() + timezoneOffset * 3600000
    const d = new Date(targetMs)
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function detectTimestampUnit(ts) {
  return Math.abs(ts) < 1e12 ? 'seconds' : 'milliseconds'
}

export function timestampToDate(ts, options = {}) {
  let { timezoneOffset = -(new Date().getTimezoneOffset() / 60), unit } = options
  if (!unit) unit = detectTimestampUnit(ts)
  const ms = unit === 'seconds' ? ts * 1000 : ts
  const targetMs = ms + timezoneOffset * 3600000
  const d = new Date(targetMs)
  const pad = n => String(n).padStart(2, '0')
  const year = d.getUTCFullYear()
  const month = d.getUTCMonth() + 1
  const day = d.getUTCDate()
  const hour = d.getUTCHours()
  const minute = d.getUTCMinutes()
  const second = d.getUTCSeconds()
  return {
    year, month, day, hour, minute, second,
    formatted: `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`,
  }
}

export function dateToTimestamp(dateStr, options = {}) {
  const { timezoneOffset = -(new Date().getTimezoneOffset() / 60), unit = 'milliseconds' } = options
  const date = new Date(dateStr)
  const machineOffset = -(date.getTimezoneOffset() / 60)
  const diffHours = machineOffset - timezoneOffset
  const utcMs = date.getTime() - diffHours * 3600000
  return unit === 'seconds' ? Math.floor(utcMs / 1000) : utcMs
}