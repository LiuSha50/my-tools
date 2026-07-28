<script setup lang="ts">
import MathFormula from './MathFormula.vue'
</script>

<template>
  <div class="mistake-list">
    <ol>
      <li data-mistake-item>
        <p>sin⁻¹x 通常表示 arcsin x，不表示 1/sin x。</p>
        <MathFormula
          formula="\sin^{-1}x = \arcsin x \ne \frac{1}{\sin x}"
          label="sin 的负一次方记号通常表示 arcsin x，不等于一除以 sin x"
        />
      </li>
      <li data-mistake-item>
        <p>1/sin x = csc x。</p>
        <details>
          <summary>例题：在 x = π/6 处核对</summary>
          <p>因为 sin(π/6) = 1/2，所以 1/sin(π/6) = 2 = csc(π/6)。</p>
          <MathFormula
            formula="\frac{1}{\sin(\pi/6)} = 2 = \csc(\pi/6)"
            label="一除以 sin π/6 等于 2，也等于 csc π/6"
            display
          />
        </details>
      </li>
      <li data-mistake-item>
        <p>1/cos x = sec x。</p>
        <MathFormula
          formula="\frac{1}{\cos x}=\sec x"
          label="一除以 cos x 等于 sec x"
        />
      </li>
      <li data-mistake-item>
        <p>反三角函数本身不具有周期性。</p>
      </li>
      <li data-mistake-item>
        <p>求反函数时定义域和值域交换。</p>
      </li>
      <li data-mistake-item>
        <p>arcsin(sin x) = x 只在 x ∈ [-π/2, π/2] 时直接成立。</p>
        <details>
          <summary>例题：x = 2π/3 时先回到主值范围</summary>
          <p>arcsin(sin(2π/3)) = π/3，因为 2π/3 不在 arcsin 的主值范围内，而 sin(2π/3) = sin(π/3)。</p>
          <MathFormula
            formula="\arcsin(\sin(2\pi/3))=\pi/3"
            label="arcsin sin 2π/3 等于 π/3"
            display
          />
        </details>
      </li>
      <li data-mistake-item>
        <p>arccos(cos x) = x 只在 x ∈ [0, π] 时直接成立。</p>
        <details>
          <summary>例题：x = 4π/3 时折回 [0, π]</summary>
          <p>arccos(cos(4π/3)) = 2π/3，而不是 4π/3；结果必须落在 arccos 的主值范围 [0, π] 内。</p>
          <MathFormula
            formula="\arccos(\cos(4\pi/3))=2\pi/3"
            label="arccos cos 4π/3 等于 2π/3"
            display
          />
        </details>
      </li>
      <li data-mistake-item>
        <p>sin(arcsin x) = x 要求 x ∈ [-1, 1]。</p>
      </li>
      <li data-mistake-item>
        <p>tan(arctan x) = x 对所有实数成立。</p>
      </li>
      <li data-mistake-item>
        <p>反函数与倒数函数是完全不同的概念。</p>
      </li>
    </ol>
  </div>
</template>
