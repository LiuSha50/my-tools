import { describe, expect, test } from 'vitest'
import { getFunctionDefinition } from '../catalog'
import { getVisibleBranches } from './branches'
import { pointsToPath, sampleFunctionBranches } from './sampling'

const viewport = { xMin: -2 * Math.PI, xMax: 2 * Math.PI, yMin: -4, yMax: 4 }

describe('断裂函数采样', () => {
  test.each([
    ['tan', 4],
    ['cot', 4],
    ['sec', 5],
    ['csc', 4],
  ] as const)('%s 生成多个连续分支', (id, minimum) => {
    expect(getVisibleBranches(id, viewport.xMin, viewport.xMax).length).toBeGreaterThanOrEqual(minimum)
  })

  test('tan 分支不跨越 π/2 渐近线', () => {
    const branches = getVisibleBranches('tan', -Math.PI, Math.PI)
    for (const branch of branches) {
      expect(branch.min < Math.PI / 2 && branch.max > Math.PI / 2).toBe(false)
      expect(branch.min < -Math.PI / 2 && branch.max > -Math.PI / 2).toBe(false)
    }
  })

  test('SVG 路径不包含非有限值', () => {
    const branches = sampleFunctionBranches(getFunctionDefinition('csc'), viewport, {
      width: 800,
      samplesPerPixel: 0.75,
    })
    const paths = branches.map(branch => pointsToPath(branch.points))
    expect(paths.join(' ')).not.toMatch(/NaN|Infinity/)
    expect(paths.every(path => path.startsWith('M'))).toBe(true)
  })
})
