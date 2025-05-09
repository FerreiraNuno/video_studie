<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useSupabaseStore } from '@/useSupabase.store'

const props = defineProps<{
  label: string
  leftLabel: string
  rightLabel: string
  modelValue: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const supabaseStore = useSupabaseStore()
const rating = ref<number | null>(null)

watch(() => props.modelValue, (newValue) => {
  rating.value = newValue
})

onMounted(() => {
  if (supabaseStore.isDevelopment && rating.value === null) {
    rating.value = 5
    emit('update:modelValue', 5)
  }
})

function updateRating (value: number) {
  rating.value = value
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="rating-scale">
    <label class="rating-label">{{ label }}</label>
    <div class="scale-container">
      <div class="end-labels">
        <span class="left-label">{{ leftLabel }}</span>
        <span class="right-label">{{ rightLabel }}</span>
      </div>
      <input
        type="range"
        :value="rating"
        @input="updateRating(Number(($event.target as HTMLInputElement).value))"
        min="0"
        max="10"
        step="1"
        class="slider"
      />
      <div class="scale-numbers">
        <span
          v-for="n in 11"
          :key="n - 1"
        >{{ n - 1 }}</span>
      </div>
    </div>
    <div class="current-value">
      <span v-if="rating !== null">{{ rating }}</span>
      <span
        v-else
        class="placeholder"
      >&nbsp;</span>
    </div>
  </div>
</template>

<style scoped>
.rating-scale {
  width: 40rem;
  max-width: 80vw;
  margin-bottom: 2rem;
}

.rating-label {
  font-weight: bold;
  margin-bottom: 0.5rem;
  display: block;
}

.scale-container {
  width: 100%;
  margin: 0 auto;
}

.end-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.scale-numbers {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #666;
}

.slider {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: #ddd;
  border-radius: 4px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: #007bff;
  border-radius: 50%;
  cursor: pointer;
}

.current-value {
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 0.5rem;
  min-height: 2rem;
  line-height: 2rem;
}

.placeholder {
  color: transparent;
}
</style>