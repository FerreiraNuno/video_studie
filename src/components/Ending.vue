<script setup lang="ts">
import { ref } from 'vue'
import EndingQuestions from '../components/EndingQuestions.vue'

const showQuestions = ref(false)
</script>

<template>
  <div class="ending-container">
    <template v-if="!showQuestions">
      <h2>Liebe Teilnehmerin, lieber Teilnehmer,</h2>

      <h2>Vielen Dank für Ihre Teilnahme an unserer Online-Studie!</h2>
      <p>
        Abschließend möchten wir Ihnen noch ein paar weitere
        Informationen zu unserer Studie geben, und Sie über die Ziele der Studie genau aufklären.

        <br>
        <br>

        Das Hauptanliegen der Studie ist es, den Einfluss eines sozialen Kontextes auf die Schmerzbeurteilung zu
        untersuchen. Daher haben wir Ihnen zusätzlich zu den Videoclips mit den Gesichtern und den Informationen zum
        Selbstbericht der Person auch immer noch eine Information zum Kontext gegeben, in dem die Schmerzbeurteilung
        erfolgen soll. Weil wir aus der Literatur wissen, dass Erwartungen bzgl. des Ziels einer Studie das Verhalten
        der Teilnehmer:innen im Verlauf dieser Studie beeinflussen, konnten wir Ihnen die Information über das
        eigentliche
        Studienziel nicht schon vorab geben.

        <br>

        Da wir Sie über den eigentlichen Untersuchungszweck getäuscht haben, möchten wir Sie darauf aufmerksam machen,
        dass Sie die Löschung Ihrer Daten auch zu diesem Zeitpunkt noch einfordern können.

        <br>
        <br>

        Damit der Versuch auch bei zukünftigen Teilnehmer:innen gelingen kann, ist es für uns sehr wichtig, dass Sie
        keinerlei Informationen über den tatsächlichen Hintergrund der Studie weitergeben.

        <br>
        <br>
        Unter folgendem Link stehen Ihnen weitere Informationen zu Studienzwecken bereit:
        <br>
        <a
          href="https://jlubox.uni-giessen.de/getlink/fiS3QAddMLM47z8ZAAKvgRCF/Probandeninfo%20NACH%20Experiment.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://jlubox.uni-giessen.de/getlink/fiS3QAddMLM47z8ZAAKvgRCF/Probandeninfo%20NACH%20Experiment.pdf
        </a>
      </p>

      <button
        class="continue-button"
        @click="showQuestions = true"
      >
        Weiter
      </button>
    </template>

    <EndingQuestions v-else />
  </div>
</template>

<style scoped>
.ending-container {
  padding: 4rem;
}

p {
  font-size: 1.2rem;
}

a {
  color: blue;
  text-decoration: none;
}

.continue-button {
  display: block;
  margin: 2rem auto 0;
  padding: 0.75rem 2rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.continue-button:hover {
  background-color: #0056b3;

}
</style>