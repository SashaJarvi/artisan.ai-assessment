<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  direction?: 'horizontal' | 'vertical';
  initialRatio?: number;
  minRatio?: number;
  maxRatio?: number;
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'horizontal',
  initialRatio: 0.6,
  minRatio: 0.2,
  maxRatio: 0.8
})

const ratio = ref(props.initialRatio)
const isDragging = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const isHorizontal = computed(() => props.direction === 'horizontal')

const firstStyle = computed(() =>
  isHorizontal.value
    ? { width: `${ratio.value * 100}%` }
    : { height: `${ratio.value * 100}%` }
)

const secondStyle = computed(() =>
  isHorizontal.value
    ? { width: `${(1 - ratio.value) * 100}%` }
    : { height: `${(1 - ratio.value) * 100}%` }
)

const handleMouseDown = (e: MouseEvent) => {
  isDragging.value = true
  e.preventDefault()

  const onMouseMove = (e: MouseEvent) => {
    if (!containerRef.value) return
    const rect = containerRef.value.getBoundingClientRect()
    const newRatio = isHorizontal.value
      ? (e.clientX - rect.left) / rect.width
      : (e.clientY - rect.top) / rect.height
    ratio.value = Math.max(props.minRatio, Math.min(props.maxRatio, newRatio))
  }

  const onMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<template>
  <div
    ref="containerRef"
    class="flex h-full w-full"
    :class="[isHorizontal ? 'flex-row' : 'flex-col']"
  >
    <div :style="firstStyle">
      <slot name="first" />
    </div>

    <div
      class="shrink-0 transition-colors"
      :class="[
        isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize',
        isDragging ? 'bg-accent' : 'bg-surface-border hover:bg-accent/50'
      ]"
      @mousedown="handleMouseDown"
    />

    <div
      class="overflow-auto"
      :style="secondStyle"
    >
      <slot name="second" />
    </div>
  </div>
</template>
