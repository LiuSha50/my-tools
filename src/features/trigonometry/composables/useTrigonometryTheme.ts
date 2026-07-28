import { computed, onMounted, onUnmounted, ref } from 'vue'

export type TrigonometryTheme = 'system' | 'light' | 'dark'
export type ResolvedTrigonometryTheme = Exclude<TrigonometryTheme, 'system'>

interface StorageCandidate {
  getItem?: (key: string) => unknown
  removeItem?: (key: string) => void
  setItem?: (key: string, value: string) => void
}

const STORAGE_KEY = 'trigonometry-theme'
const DARK_THEME_QUERY = '(prefers-color-scheme: dark)'

function getBrowserStorage(): StorageCandidate | null {
  if (typeof window === 'undefined') return null

  try {
    const storage = window.localStorage as StorageCandidate | null | undefined
    return storage && (typeof storage === 'object' || typeof storage === 'function')
      ? storage
      : null
  } catch {
    return null
  }
}

function safeStorageGet(storage: StorageCandidate | null, key: string): unknown {
  if (!storage) return null

  try {
    return typeof storage.getItem === 'function'
      ? storage.getItem.call(storage, key)
      : null
  } catch {
    return null
  }
}

function safeStorageRemove(storage: StorageCandidate | null, key: string): void {
  if (!storage) return

  try {
    if (typeof storage.removeItem === 'function') storage.removeItem.call(storage, key)
  } catch {
    // Storage can be denied per operation; theme state remains usable in memory.
  }
}

function safeStorageSet(storage: StorageCandidate | null, key: string, value: string): void {
  if (!storage) return

  try {
    if (typeof storage.setItem === 'function') storage.setItem.call(storage, key, value)
  } catch {
    // Storage can be denied per operation; theme state remains usable in memory.
  }
}

function readStoredTheme(): TrigonometryTheme {
  const storage = getBrowserStorage()
  const storedTheme = safeStorageGet(storage, STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme
  if (storedTheme !== null) safeStorageRemove(storage, STORAGE_KEY)
  return 'system'
}

export function useTrigonometryTheme() {
  // Keep setup deterministic for SSR and hydration; browser state is read after mount.
  const theme = ref<TrigonometryTheme>('system')
  const systemIsDark = ref(false)
  let mediaQuery: MediaQueryList | null = null
  let listenerRegistered = false

  const resolvedTheme = computed<ResolvedTrigonometryTheme>(() => {
    if (theme.value !== 'system') return theme.value
    return systemIsDark.value ? 'dark' : 'light'
  })

  function handleSystemThemeChange(event: MediaQueryListEvent) {
    systemIsDark.value = event.matches
  }

  function toggleTheme() {
    const nextTheme: ResolvedTrigonometryTheme = resolvedTheme.value === 'dark' ? 'light' : 'dark'
    theme.value = nextTheme
    safeStorageSet(getBrowserStorage(), STORAGE_KEY, nextTheme)
  }

  onMounted(() => {
    theme.value = readStoredTheme()
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    try {
      mediaQuery = window.matchMedia(DARK_THEME_QUERY)
      systemIsDark.value = Boolean(mediaQuery.matches)
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleSystemThemeChange)
        listenerRegistered = true
      }
    } catch {
      mediaQuery = null
      listenerRegistered = false
    }
  })

  onUnmounted(() => {
    if (listenerRegistered && mediaQuery && typeof mediaQuery.removeEventListener === 'function') {
      try {
        mediaQuery.removeEventListener('change', handleSystemThemeChange)
      } catch {
        // A revoked media-query object must not make component teardown fail.
      }
    }
    listenerRegistered = false
    mediaQuery = null
  })

  return { theme, resolvedTheme, toggleTheme }
}
