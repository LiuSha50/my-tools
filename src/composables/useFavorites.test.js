import { describe, test, expect, beforeEach, vi } from 'vitest'

// mock localStorage
const store = {}
vi.stubGlobal('localStorage', {
  getItem: (key) => store[key] ?? null,
  setItem: (key, val) => { store[key] = val },
  clear: () => { Object.keys(store).forEach(k => delete store[k]) },
})

import { useFavorites, _resetFavorites } from './useFavorites'

beforeEach(() => {
  localStorage.clear()
  _resetFavorites()
})

describe('useFavorites', () => {
  test('初始状态为空', () => {
    const { favorites } = useFavorites()
    expect(favorites.value).toEqual([])
  })

  test('添加收藏', () => {
    const { favorites, toggle } = useFavorites()
    toggle('timestamp')
    expect(favorites.value).toEqual(['timestamp'])
  })

  test('取消收藏', () => {
    const { favorites, toggle } = useFavorites()
    toggle('timestamp')
    toggle('aes')
    toggle('timestamp')
    expect(favorites.value).toEqual(['aes'])
  })

  test('判断是否已收藏', () => {
    const { isFavorite, toggle } = useFavorites()
    expect(isFavorite('timestamp')).toBe(false)
    toggle('timestamp')
    expect(isFavorite('timestamp')).toBe(true)
  })

  test('持久化到 localStorage', () => {
    const { toggle } = useFavorites()
    toggle('timestamp')
    toggle('md5')
    expect(localStorage.getItem('fav-tools')).toBe('["timestamp","md5"]')
  })

  test('从 localStorage 恢复', () => {
    localStorage.setItem('fav-tools', '["aes","sha"]')
    _resetFavorites()
    const { favorites } = useFavorites()
    expect(favorites.value).toEqual(['aes', 'sha'])
  })

  test('忽略损坏的 localStorage 数据', () => {
    localStorage.setItem('fav-tools', 'invalid')
    _resetFavorites()
    const { favorites } = useFavorites()
    expect(favorites.value).toEqual([])
  })
})