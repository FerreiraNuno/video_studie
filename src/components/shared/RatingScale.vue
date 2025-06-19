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

function updateRating (value: number) {
  rating.value = value
  emit('update:modelValue', value)
}
</script>

<template>
  <div
    v-if="label !== ''"
    class="main-label"
  >{{ label }}</div>
  <div class="rating">
    <span class="left-label rating-label">{{ leftLabel }}</span>
    <div class="rating-scale">
      <div class="scale-container">
        <input
          type="range"
          :value="rating"
          @input="updateRating(Number(($event.target as HTMLInputElement).value))"
          @click="updateRating(Number(($event.target as HTMLInputElement).value))"
          min="0"
          max="10"
          step="1"
          class="slider"
          :class="{ 'has-value': rating !== null }"
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
    <span class="right-label rating-label">{{ rightLabel }}</span>
  </div>
</template>

<style scoped>
.main-label {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.rating {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 1rem;

  @media screen and (max-width: 1280px) {
    gap: 0.25rem;
  }
}

.rating-scale {
  width: 80%;
  margin-bottom: 2rem;

  @media screen and (max-width: 1280px) {
    width: 60%;
  }
}

.rating-label {
  width: 20rem;
  font-weight: bold;
  display: block;

  @media screen and (max-width: 1280px) {
    width: 7rem;
    font-size: 0.75rem;
  }
}

.left-label {
  text-align: right;
}

.right-label {
  text-align: left;
}

.scale-container {
  width: 100%;
  margin: 0 auto;
}

.scale-numbers {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #666;
  margin-left: 0.5rem;
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
  opacity: 0;
  transition: opacity 0.2s ease;
}

.slider.has-value::-webkit-slider-thumb {
  opacity: 1;
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