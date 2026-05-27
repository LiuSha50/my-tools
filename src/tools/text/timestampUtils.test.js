import {
  getWeekNumber,
  getLunarDate,
  formatDateTime,
  timestampToDate,
  dateToTimestamp,
  detectTimestampUnit,
} from './timestampUtils'

// 2024-01-01 00:00:00 in UTC+8 = 1704038400000 ms
const TS_2024_0101_UTC8 = 1704038400000

describe('getWeekNumber', () => {
  test('2024-01-01 是第1周', () => {
    expect(getWeekNumber(new Date('2024-01-01'))).toBe(1)
  })

  test('2024-01-07 是第1周', () => {
    expect(getWeekNumber(new Date('2024-01-07'))).toBe(1)
  })

  test('2024-01-08 是第2周', () => {
    expect(getWeekNumber(new Date('2024-01-08'))).toBe(2)
  })

  test('2025-05-27 是第22周', () => {
    expect(getWeekNumber(new Date('2025-05-27'))).toBe(22)
  })
})

describe('getLunarDate', () => {
  test('2024-02-10 是农历甲辰年正月初一（春节）', () => {
    const result = getLunarDate(new Date('2024-02-10'))
    expect(result.yearGanZhi).toBe('甲辰')
    expect(result.month).toBe(1)
    expect(result.day).toBe(1)
    expect(result.isLeapMonth).toBe(false)
  })

  test('2024-01-01 是农历癸卯年十一月二十', () => {
    const result = getLunarDate(new Date('2024-01-01'))
    expect(result.yearGanZhi).toBe('癸卯')
    expect(result.month).toBe(11)
    expect(result.day).toBe(20)
  })

  test('2025-01-29 是农历乙巳年正月初一', () => {
    const result = getLunarDate(new Date('2025-01-29'))
    expect(result.yearGanZhi).toBe('乙巳')
    expect(result.month).toBe(1)
    expect(result.day).toBe(1)
  })

  test('2025-05-27 是农历乙巳年五月初一', () => {
    const result = getLunarDate(new Date('2025-05-27'))
    expect(result.yearGanZhi).toBe('乙巳')
    expect(result.month).toBe(5)
    expect(result.day).toBe(1)
  })

  test('返回可读的字符串格式', () => {
    const result = getLunarDate(new Date('2024-02-10'))
    expect(result.toString()).toBe('甲辰年正月初一')
  })
})

describe('formatDateTime', () => {
  test('默认格式化为 YYYY-MM-DD HH:mm:ss', () => {
    const date = new Date('2024-03-15T08:30:45')
    expect(formatDateTime(date)).toBe('2024-03-15 08:30:45')
  })

  test('支持指定时区偏移', () => {
    const date = new Date('2024-03-15T00:00:00Z')
    expect(formatDateTime(date, { timezoneOffset: 8 })).toBe('2024-03-15 08:00:00')
  })

  test('UTC+0 时区', () => {
    const date = new Date('2024-03-15T08:30:45Z')
    expect(formatDateTime(date, { timezoneOffset: 0 })).toBe('2024-03-15 08:30:45')
  })

  test('UTC-5 时区', () => {
    const date = new Date('2024-03-15T08:30:45Z')
    expect(formatDateTime(date, { timezoneOffset: -5 })).toBe('2024-03-15 03:30:45')
  })
})

describe('detectTimestampUnit', () => {
  test('小于 1e12 判定为秒级时间戳', () => {
    expect(detectTimestampUnit(1700000000)).toBe('seconds')
  })

  test('大于等于 1e12 判定为毫秒级时间戳', () => {
    expect(detectTimestampUnit(1700000000000)).toBe('milliseconds')
  })

  test('0 判定为秒级', () => {
    expect(detectTimestampUnit(0)).toBe('seconds')
  })
})

describe('timestampToDate', () => {
  test('毫秒时间戳转日期 (UTC+8)', () => {
    const result = timestampToDate(TS_2024_0101_UTC8, { timezoneOffset: 8 })
    expect(result.year).toBe(2024)
    expect(result.month).toBe(1)
    expect(result.day).toBe(1)
  })

  test('秒时间戳转日期 (UTC+8)', () => {
    const result = timestampToDate(TS_2024_0101_UTC8 / 1000, { timezoneOffset: 8, unit: 'seconds' })
    expect(result.year).toBe(2024)
    expect(result.month).toBe(1)
    expect(result.day).toBe(1)
  })

  test('自动检测时间戳单位', () => {
    const result = timestampToDate(TS_2024_0101_UTC8, { timezoneOffset: 8 })
    expect(result.year).toBe(2024)
  })

  test('返回格式化的日期字符串 (UTC+8)', () => {
    const result = timestampToDate(TS_2024_0101_UTC8, { timezoneOffset: 8 })
    expect(result.formatted).toBe('2024-01-01 00:00:00')
  })

  test('UTC+0 时区', () => {
    const result = timestampToDate(TS_2024_0101_UTC8, { timezoneOffset: 0 })
    expect(result.formatted).toBe('2023-12-31 16:00:00')
  })
})

describe('dateToTimestamp', () => {
  test('日期转毫秒时间戳 (UTC+8)', () => {
    const result = dateToTimestamp('2024-01-01T00:00:00', { timezoneOffset: 8, unit: 'milliseconds' })
    expect(result).toBe(TS_2024_0101_UTC8)
  })

  test('日期转秒时间戳 (UTC+8)', () => {
    const result = dateToTimestamp('2024-01-01T00:00:00', { timezoneOffset: 8, unit: 'seconds' })
    expect(result).toBe(TS_2024_0101_UTC8 / 1000)
  })

  test('默认返回毫秒时间戳', () => {
    const result = dateToTimestamp('2024-01-01T00:00:00', { timezoneOffset: 8 })
    expect(result).toBe(TS_2024_0101_UTC8)
  })
})