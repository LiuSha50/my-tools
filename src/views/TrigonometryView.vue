<script setup lang="ts">
import { functionCatalog } from '../features/trigonometry/catalog'
import InverseRelationPanel from '../features/trigonometry/components/InverseRelationPanel.vue'
import MistakeList from '../features/trigonometry/components/MistakeList.vue'
import PropertyPanel from '../features/trigonometry/components/PropertyPanel.vue'
import SupplementPanel from '../features/trigonometry/components/SupplementPanel.vue'
import SymbolLegend from '../features/trigonometry/components/SymbolLegend.vue'
import TrigonometryWorkbench from '../features/trigonometry/components/TrigonometryWorkbench.vue'
import { useTrigonometryTheme } from '../features/trigonometry/composables/useTrigonometryTheme'
import '../features/trigonometry/styles.css'

const trigDefinitions = functionCatalog.filter(definition => definition.category === 'trig')
const inverseDefinitions = functionCatalog.filter(definition => definition.category === 'inverse')
const { resolvedTheme, toggleTheme } = useTrigonometryTheme()

const pageAnchors = [
  { id: 'workbench', label: '交互图像' },
  { id: 'trig-properties', label: '三角函数' },
  { id: 'inverse-properties', label: '反三角函数' },
  { id: 'inverse-relation', label: '反函数关系' },
  { id: 'mistakes', label: '易错点' },
  { id: 'supplement', label: '补充内容' },
  { id: 'symbols', label: '符号说明' },
] as const
</script>

<template>
  <main class="trigonometry-page" :data-theme="resolvedTheme">
    <div class="trigonometry-page__background" aria-hidden="true" />

    <header class="page-header">
      <nav class="breadcrumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span aria-hidden="true">/</span>
        <span>数学</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page">三角函数手册</span>
      </nav>

      <div class="title-row">
        <div>
          <p class="eyebrow">大学微积分 · 交互式速查</p>
          <h1>常见三角函数与反三角函数</h1>
          <p class="page-intro">从图像、性质与反函数关系出发，建立可随时查阅的弧度制知识地图。</p>
        </div>
        <button
          type="button"
          class="theme-toggle"
          data-action="toggle-theme"
          :aria-label="`切换为${resolvedTheme === 'dark' ? '浅色' : '深色'}主题`"
          @click="toggleTheme"
        >
          {{ resolvedTheme === 'dark' ? '浅色主题' : '深色主题' }}
        </button>
      </div>

      <div class="convention-banner" role="note" aria-label="本页数学约定">
        <strong>默认采用弧度制</strong>
        <span>k ∈ Z</span>
        <span class="arccot-convention">arccot 主值范围采用 (0, π)</span>
      </div>
    </header>

    <nav class="page-anchors" aria-label="本页目录">
      <a
        v-for="anchor in pageAnchors"
        :key="anchor.id"
        data-page-anchor
        :href="`#${anchor.id}`"
      >
        {{ anchor.label }}
      </a>
    </nav>

    <section id="workbench" class="page-section page-section--workbench" aria-labelledby="workbench-title">
      <div class="section-heading">
        <p class="section-number">01</p>
        <div>
          <h2 id="workbench-title">科学工作台</h2>
          <p>选择同一类别中的函数，对照图像、标记和当前性质；默认选择 sin x。</p>
        </div>
      </div>
      <TrigonometryWorkbench />
    </section>

    <section id="trig-properties" class="page-section" aria-labelledby="trig-properties-title">
      <div class="section-heading">
        <p class="section-number">02</p>
        <div>
          <h2 id="trig-properties-title">三角函数</h2>
          <p>六个基础三角函数的完整性质。所有含 k 的区间均约定 k ∈ Z。</p>
        </div>
      </div>
      <PropertyPanel :definitions="trigDefinitions" />
    </section>

    <section id="inverse-properties" class="page-section" aria-labelledby="inverse-properties-title">
      <div class="section-heading">
        <p class="section-number">03</p>
        <div>
          <h2 id="inverse-properties-title">反三角函数</h2>
          <p>四个主要反三角函数均直接列出主值范围；反三角函数本身没有周期。</p>
          <p class="important-convention">特别约定：arccot 主值范围采用 (0, π)，对应 cot x 在 (0, π) 上的限制。</p>
        </div>
      </div>
      <PropertyPanel :definitions="inverseDefinitions" />
    </section>

    <section id="inverse-relation" class="page-section" aria-labelledby="inverse-relation-title">
      <div class="section-heading">
        <p class="section-number">04</p>
        <div>
          <h2 id="inverse-relation-title">反函数从哪里来</h2>
          <p>先把原三角函数限制为一一对应，再交换定义域和值域；两条图像关于 y = x 对称。</p>
        </div>
      </div>
      <InverseRelationPanel />
    </section>

    <section id="mistakes" class="page-section" aria-labelledby="mistakes-title">
      <div class="section-heading">
        <p class="section-number">05</p>
        <div>
          <h2 id="mistakes-title">易错点</h2>
          <p>先辨认反函数、倒数与主值范围，再展开例题核对。</p>
        </div>
      </div>
      <MistakeList />
    </section>

    <section id="supplement" class="page-section" aria-labelledby="supplement-title">
      <div class="section-heading">
        <p class="section-number">06</p>
        <div>
          <h2 id="supplement-title">补充内容</h2>
          <p>这里只补充 arcsec 与 arccsc，不将它们混入主要反三角函数筛选。</p>
        </div>
      </div>
      <SupplementPanel />
    </section>

    <section id="symbols" class="page-section" aria-labelledby="symbols-title">
      <div class="section-heading">
        <p class="section-number">07</p>
        <div>
          <h2 id="symbols-title">符号说明</h2>
          <p>集合、区间、图像标记与线型的统一读法。</p>
        </div>
      </div>
      <SymbolLegend />
    </section>
  </main>
</template>
