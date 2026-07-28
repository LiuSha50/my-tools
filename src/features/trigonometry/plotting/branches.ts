import type { FunctionId } from '../types'

export interface BranchInterval {
  id: string
  min: number
  max: number
  minOpen: boolean
  maxOpen: boolean
}

type BranchFamily = {
  offset: number
  period: number
}

const branchFamilies: Partial<Record<FunctionId, BranchFamily>> = {
  tan: { offset: Math.PI / 2, period: Math.PI },
  sec: { offset: Math.PI / 2, period: Math.PI },
  cot: { offset: 0, period: Math.PI },
  csc: { offset: 0, period: Math.PI },
}

function branchId(id: FunctionId, index: number): string {
  return `${id}-branch-${index}`
}

function clippedBranch(
  id: FunctionId,
  index: number,
  domainMin: number,
  domainMax: number,
  xMin: number,
  xMax: number,
  domainMinOpen = false,
  domainMaxOpen = false,
): BranchInterval | undefined {
  const min = Math.max(domainMin, xMin)
  const max = Math.min(domainMax, xMax)

  if (min >= max) {
    return undefined
  }

  return {
    id: branchId(id, index),
    min,
    max,
    minOpen: min === domainMin && domainMinOpen,
    maxOpen: max === domainMax && domainMaxOpen,
  }
}

function getPeriodicBranches(
  id: FunctionId,
  xMin: number,
  xMax: number,
  family: BranchFamily,
): BranchInterval[] {
  const firstIndex = Math.floor((xMin - family.offset) / family.period)
  const lastIndex = Math.floor((xMax - family.offset) / family.period)
  const branches: BranchInterval[] = []

  for (let index = firstIndex; index <= lastIndex; index += 1) {
    const domainMin = family.offset + index * family.period
    const domainMax = domainMin + family.period
    const branch = clippedBranch(
      id,
      index,
      domainMin,
      domainMax,
      xMin,
      xMax,
      true,
      true,
    )

    if (branch) {
      branches.push(branch)
    }
  }

  return branches
}

function getInverseBranches(id: FunctionId, xMin: number, xMax: number): BranchInterval[] {
  if (id === 'arcsin' || id === 'arccos') {
    const branch = clippedBranch(id, 0, -1, 1, xMin, xMax)
    return branch ? [branch] : []
  }

  if (id === 'arcsec' || id === 'arccsc') {
    const negative = clippedBranch(id, -1, -Infinity, -1, xMin, xMax)
    const positive = clippedBranch(id, 1, 1, Infinity, xMin, xMax)
    return [negative, positive].filter((branch): branch is BranchInterval => branch !== undefined)
  }

  const branch = clippedBranch(id, 0, -Infinity, Infinity, xMin, xMax)
  return branch ? [branch] : []
}

export function getVisibleBranches(
  id: FunctionId,
  xMin: number,
  xMax: number,
): BranchInterval[] {
  if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin >= xMax) {
    return []
  }

  const family = branchFamilies[id]
  if (family) {
    return getPeriodicBranches(id, xMin, xMax, family)
  }

  if (id === 'sin' || id === 'cos') {
    return [{ id: branchId(id, 0), min: xMin, max: xMax, minOpen: false, maxOpen: false }]
  }

  return getInverseBranches(id, xMin, xMax)
}
