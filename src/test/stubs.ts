/**
 * Stand-ins for the media and rating components used by the phase flow
 * tests. Each declares the real component's props (so the flow tests can
 * assert what the phase passes down) and emits the real component's events
 * on demand through `wrapper.findComponent(Stub).vm.$emit(...)`.
 * Render functions, not templates: the test build of Vue has no compiler.
 */
import { defineComponent, h } from 'vue'

export const ContextStub = defineComponent({
  name: 'ContextStub',
  props: { imageNumber: Number, text: String, context: String, group: String },
  emits: ['next'],
  setup: (props) => () => h('div', { class: 'stub-context', 'data-context': props.context, 'data-part': props.text }),
})

export const InstructionAudioStub = defineComponent({
  name: 'InstructionAudioStub',
  props: { videoIndex: Number, context: String },
  emits: ['audio-ended'],
  setup: (props) => () => h('div', { class: 'stub-instruction', 'data-video-index': props.videoIndex }),
})

export const VideoStub = defineComponent({
  name: 'VideoStub',
  props: { videoIndex: Number },
  emits: ['video-ended'],
  setup: (props) => () => h('div', { class: 'stub-video', 'data-video-index': props.videoIndex }),
})

export const PhaseTwoRatingStub = defineComponent({
  name: 'PhaseTwoRatingStub',
  props: { videoIndex: Number, filename: String, context: String },
  emits: ['rating-submitted'],
  setup: (props) => () => h('div', { class: 'stub-rating', 'data-video-index': props.videoIndex, 'data-context': props.context }),
})

export const PhotoStub = defineComponent({
  name: 'PhotoStub',
  props: { photoIndex: Number },
  emits: ['photo-ended'],
  setup: (props) => () => h('div', { class: 'stub-photo', 'data-photo-index': props.photoIndex }),
})

export const PhaseThreeRatingStub = defineComponent({
  name: 'PhaseThreeRatingStub',
  props: { photoIndex: Number },
  emits: ['rating-submitted'],
  setup: (props) => () => h('div', { class: 'stub-photo-rating', 'data-photo-index': props.photoIndex }),
})

export const FinalQuestionsStub = defineComponent({
  name: 'FinalQuestionsStub',
  setup: () => () => h('div', { class: 'stub-final-questions' }),
})
