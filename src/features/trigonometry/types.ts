export type FunctionId =
  | 'sin' | 'cos' | 'tan' | 'cot' | 'sec' | 'csc'
  | 'arcsin' | 'arccos' | 'arctan' | 'arccot'
  | 'arcsec' | 'arccsc'

export type MainFunctionId = Exclude<FunctionId, 'arcsec' | 'arccsc'>
export type FunctionCategory = 'trig' | 'inverse' | 'supplement'
export type LinePattern = 'solid' | 'dashed' | 'dash-dot' | 'dotted'
export type IntervalText = string
export type MathPointKind = 'key' | 'zero' | 'maximum' | 'minimum'

export interface MathPoint {
  id: string
  x: number
  y: number
  xLabel: string
  yLabel: string
  kind: MathPointKind
  additionalKinds?: readonly MathPointKind[]
}

export interface InverseRelation {
  originalId: 'sin' | 'cos' | 'tan' | 'cot'
  inverseId: 'arcsin' | 'arccos' | 'arctan' | 'arccot'
  restriction: string
  restrictionBounds: { min: number; max: number; minOpen: boolean; maxOpen: boolean }
}

export interface FunctionDefinition {
  id: FunctionId
  category: FunctionCategory
  name: string
  formula: string
  domain: string
  range: string
  principalRange?: string
  parity: string
  increasingIntervals: readonly IntervalText[]
  decreasingIntervals: readonly IntervalText[]
  period: string
  zeros: string
  extrema: string
  verticalAsymptotes: readonly string[]
  horizontalAsymptotes: readonly string[]
  continuousIntervals: readonly IntervalText[]
  derivative: string
  endpointNotes: readonly string[]
  limitNotes: readonly string[]
  keyPoints: readonly MathPoint[]
  evaluate: (x: number) => number
  isDefined: (x: number) => boolean
  inverseRelation?: InverseRelation
  conventionNote?: string
  style: { color: string; darkColor: string; pattern: LinePattern; label: string }
}
