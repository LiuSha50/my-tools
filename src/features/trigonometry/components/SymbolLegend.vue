<script setup lang="ts">
import { functionCatalog } from '../catalog'
import type { LinePattern } from '../types'
import MathFormula from './MathFormula.vue'

const patternNames: Record<LinePattern, string> = {
  solid: '实线',
  dashed: '虚线',
  'dash-dot': '点划线',
  dotted: '点线',
}

const catalogPatterns = [...new Set(functionCatalog.map(definition => definition.style.pattern))]
</script>

<template>
  <div class="symbol-legend">
    <div class="symbol-grid">
      <section aria-labelledby="set-symbols-title">
        <h3 id="set-symbols-title">集合与区间</h3>
        <dl>
          <div><dt>R</dt><dd>R：全体实数。</dd></div>
          <div><dt>Z</dt><dd>Z：全体整数。</dd></div>
          <div><dt>k ∈ Z</dt><dd>k ∈ Z：k 可取任意整数。</dd></div>
          <div><dt>(a, b)</dt><dd>开区间：不包含端点 a、b。</dd></div>
          <div><dt>[a, b]</dt><dd>闭区间：包含端点 a、b。</dd></div>
          <div><dt>∪</dt><dd>并集：合并两个集合中的元素。</dd></div>
          <div><dt>\</dt><dd><code>\</code> 表示从前一个集合中排除后一个集合。</dd></div>
        </dl>
      </section>

      <section aria-labelledby="plot-symbols-title">
        <h3 id="plot-symbols-title">图像标记</h3>
        <ul>
          <li><span class="asymptote-sample asymptote-sample--vertical" aria-hidden="true" />竖直渐近线：函数在某个 x 值附近无界趋近。</li>
          <li><span class="asymptote-sample" aria-hidden="true" />水平渐近线：函数在远端趋近某个 y 值。</li>
          <li><span class="point-sample" aria-hidden="true" />关键点、零点和极值点使用独立圆点标记。</li>
        </ul>
      </section>
    </div>

    <section class="line-legend" aria-labelledby="line-patterns-title">
      <h3 id="line-patterns-title">曲线线型</h3>
      <p>颜色、线型与曲线标签会共同区分函数，不能只依靠颜色辨认。</p>
      <ul>
        <li v-for="pattern in catalogPatterns" :key="pattern">
          <span class="line-sample" :data-legend-pattern="pattern" :data-pattern="pattern" aria-hidden="true" />
          <span>{{ patternNames[pattern] }}</span>
        </li>
      </ul>
    </section>

    <p class="interaction-note">
      图像支持滚轮或按钮缩放、拖动平移，并可用关键点、渐近线与坐标文字摘要核对结果。
      <MathFormula formula="y=x" label="反函数关系图的对称轴 y 等于 x" />
    </p>
  </div>
</template>
