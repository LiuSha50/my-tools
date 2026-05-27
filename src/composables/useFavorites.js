import { ref } from 'vue'

const STORAGE_KEY = 'fav-tools'
let favorites = ref(load())

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.value))
}

export function useFavorites() {
  function toggle(id) {
    const idx = favorites.value.indexOf(id)
    if (idx === -1) {
      favorites.value.push(id)
    } else {
      favorites.value.splice(idx, 1)
    }
    save()
  }

  function isFavorite(id) {
    return favorites.value.includes(id)
  }

  return { favorites, toggle, isFavorite }
}

export function _resetFavorites() {
  favorites.value = load()
}