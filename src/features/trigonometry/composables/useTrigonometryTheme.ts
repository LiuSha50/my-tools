import { computed, onMounted, onUnmounted, ref } from 'vue'

export type TrigonometryTheme = 'system' | 'light' | 'dark'
export type ResolvedTrigonometryTheme = Exclude<TrigonometryTheme, 'system'>

const STORAGE_KEY = 'trigonometry-theme'
const DARK_THEME_QUERY = '(prefers-color-scheme: dark)'

function readStoredTheme(): TrigonometryTheme {
  if (typeof localStorage === 'undefined') return 'system'

  const storedTheme = localStorage.getItem(STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme
  if (storedTheme !== null) localStorage.removeItem(STORAGE_KEY)
  return 'system'
}

export function useTrigonometryTheme() {
  const theme = ref<TrigonometryTheme>(readStoredTheme())
  const systemIsDark = ref(false)
  let mediaQuery: MediaQueryList | null = null

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
    localStorage.setItem(STORAGE_KEY, nextTheme)
  }

  onMounted(() => {
    mediaQuery = window.matchMedia(DARK_THEME_QUERY)
    systemIsDark.value = mediaQuery.matches
    mediaQuery.addEventListener('change', handleSystemThemeChange)
  })

  onUnmounted(() => {
    mediaQuery?.removeEventListener('change', handleSystemThemeChange)
    mediaQuery = null
  })

  return { theme, resolvedTheme, toggleTheme }
}
