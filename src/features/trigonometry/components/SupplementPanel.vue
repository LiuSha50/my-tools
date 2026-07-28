<script setup lang="ts">
import { getFunctionDefinition, supplementFunctionIds } from '../catalog'
import MathFormula from './MathFormula.vue'

const supplements = supplementFunctionIds.map(getFunctionDefinition)
</script>

<template>
  <div class="supplement-panel">
    <p class="convention-warning">
      arcsec 与 arccsc 仅作为补充函数列出。不同教材可能采用不同的主值范围约定；使用公式前请先确认教材采用的定义。
    </p>
    <div class="supplement-grid">
      <article
        v-for="definition in supplements"
        :key="definition.id"
        class="supplement-card"
        :data-supplement-function="definition.id"
      >
        <h3>{{ definition.name }}</h3>
        <MathFormula
          :formula="definition.formula"
          :label="`${definition.name}公式：${definition.formula}`"
          display
        />
        <dl>
          <div>
            <dt>定义域</dt>
            <dd>
              <MathFormula :formula="definition.domain" :label="`${definition.name}定义域：${definition.domain}`" />
            </dd>
          </div>
          <div>
            <dt>本页采用的主值范围</dt>
            <dd>
              <MathFormula
                :formula="definition.principalRange ?? definition.range"
                :label="`${definition.name}本页采用的主值范围：${definition.principalRange ?? definition.range}`"
              />
            </dd>
          </div>
          <div>
            <dt>导数</dt>
            <dd>
              <MathFormula :formula="definition.derivative" :label="`${definition.name}导数：${definition.derivative}`" />
            </dd>
          </div>
        </dl>
        <p class="convention-note">{{ definition.conventionNote }}</p>
      </article>
    </div>
  </div>
</template>
