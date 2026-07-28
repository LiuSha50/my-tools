import { describe, expect, test } from 'vitest'
import { getFunctionDefinition, inverseFunctionIds } from './catalog'

describe('反函数关系', () => {
  test.each(inverseFunctionIds)('%s 具有原函数限制', id => {
    const relation = getFunctionDefinition(id).inverseRelation
    expect(relation).toBeDefined()
    expect(relation?.inverseId).toBe(id)
    expect(relation?.restriction).toBeTruthy()
  })
})
