import { useState, useEffect, useCallback, useRef } from 'react';

// Check for browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechSynthesis = window.speechSynthesis;

export const useVoice = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);

  // Check browser support on mount
  useEffect(() => {
    const supported = !!(SpeechRecognition && speechSynthesis);
    setIsSupported(supported);
    
    if (supported && SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return false;
    
    try {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      return false;
    }
  }, [isSupported]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  // Speak text
  const speak = useCallback((text) => {
    if (!isSupported || !speechSynthesis || !voiceEnabled) return false;
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Try to find a Spanish voice
    const voices = speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    return true;
  }, [isSupported, voiceEnabled]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Toggle voice output
  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      if (prev && isSpeaking) {
        stopSpeaking();
      }
      return !prev;
    });
  }, [isSpeaking, stopSpeaking]);

  return {
    isListening,
    isSpeaking,
    transcript,
    voiceEnabled,
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    toggleVoice,
    setTranscript
  };
};
