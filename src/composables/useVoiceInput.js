import { ref, onUnmounted } from 'vue'

/**
 * Web Speech API (SpeechRecognition) composable
 * 한국어 음성 인식, 브라우저 미지원 시 graceful 폴백
 */
export function useVoiceInput() {
  const isListening = ref(false)
  const transcript = ref('')
  const error = ref(null)
  const isSupported = ref(false)

  let recognition = null

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  isSupported.value = !!SpeechRecognition

  if (SpeechRecognition) {
    recognition = new SpeechRecognition()
    recognition.lang = 'ko-KR'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event) => {
      const results = Array.from(event.results)
      transcript.value = results.map((r) => r[0].transcript).join('')
    }

    recognition.onerror = (event) => {
      error.value = event.error === 'no-speech'
        ? '음성이 감지되지 않았습니다. 다시 시도해주세요.'
        : event.error === 'not-allowed'
          ? '마이크 권한이 필요합니다.'
          : '음성 인식에 실패했습니다. 다시 시도해주세요.'
      isListening.value = false
    }

    recognition.onend = () => {
      isListening.value = false
    }
  }

  function startListening() {
    if (!recognition) {
      error.value = '이 브라우저는 음성 인식을 지원하지 않습니다.'
      return
    }
    error.value = null
    transcript.value = ''
    isListening.value = true
    recognition.start()
  }

  function stopListening() {
    if (recognition && isListening.value) {
      recognition.stop()
      isListening.value = false
    }
  }

  function resetTranscript() {
    transcript.value = ''
    error.value = null
  }

  onUnmounted(() => {
    stopListening()
  })

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  }
}
