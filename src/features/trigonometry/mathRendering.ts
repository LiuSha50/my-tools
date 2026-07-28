import katex from 'katex'

export type FormulaRenderer = (
  formula: string,
  options: katex.KatexOptions,
) => string

export interface RenderedFormula {
  html: string | null
  text: string
}

const safeKatexOptions = (display: boolean): katex.KatexOptions => ({
  displayMode: display,
  throwOnError: false,
  trust: false,
  output: 'htmlAndMathml',
  strict: 'warn',
})

export function renderFormula(
  formula: string,
  display: boolean,
  renderer: FormulaRenderer = katex.renderToString,
): RenderedFormula {
  try {
    return {
      html: renderer(formula, safeKatexOptions(display)),
      text: formula,
    }
  } catch {
    return { html: null, text: formula }
  }
}
