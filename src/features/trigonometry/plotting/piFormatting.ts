const RATIONAL_DENOMINATORS = [1, 2, 3, 4, 6] as const
const PI_TOLERANCE = 1e-8

export interface PlotTick {
  value: number
  label: string
}

function greatestCommonDivisor(a: number, b: number): number {
  let left = Math.abs(a)
  let right = Math.abs(b)

  while (right !== 0) {
    const remainder = left % right
    left = right
    right = remainder
  }

  return left
}

function formatDecimal(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value)
  }

  const rounded = Number(value.toFixed(3))
  return Object.is(rounded, -0) ? '0' : String(rounded)
}

export function formatPiMultiple(value: number): string {
  const ratio = value / Math.PI

  for (const denominator of RATIONAL_DENOMINATORS) {
    const numerator = Math.round(ratio * denominator)

    if (Math.abs(ratio - numerator / denominator) > PI_TOLERANCE) {
      continue
    }

    if (numerator === 0) {
      return '0'
    }

    const divisor = greatestCommonDivisor(numerator, denominator)
    const reducedNumerator = numerator / divisor
    const reducedDenominator = denominator / divisor
    const sign = reducedNumerator < 0 ? '−' : ''
    const magnitude = Math.abs(reducedNumerator)
    const coefficient = magnitude === 1 ? '' : String(magnitude)
    const fraction = reducedDenominator === 1 ? '' : `/${reducedDenominator}`

    return `${sign}${coefficient}π${fraction}`
  }

  return formatDecimal(value)
}

export function createPiTicks(min: number, max: number, step: number): PlotTick[] {
  if (![min, max, step].every(Number.isFinite) || step <= 0 || min > max) {
    return []
  }

  const firstIndex = Math.ceil((min - PI_TOLERANCE) / step)
  const lastIndex = Math.floor((max + PI_TOLERANCE) / step)
  const ticks: PlotTick[] = []

  for (let index = firstIndex; index <= lastIndex; index += 1) {
    const value = index === 0 ? 0 : index * step
    ticks.push({ value, label: formatPiMultiple(value) })
  }

  return ticks
}
