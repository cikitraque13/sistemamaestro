import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Microphone, MicrophoneSlash, SpeakerHigh, SpeakerSlash, Stop } from '@phosphor-icons/react';

const VoiceButton = ({ 
  isListening, 
  isSpeaking,
  voiceEnabled,
  isSupported,
  onStartListening, 
  onStopListening,
  onStopSpeaking,
  onToggleVoice,
  size = 'default'
}) => {
  if (!isSupported) return null;

  const sizeClasses = {
    small: 'w-8 h-8',
    default: 'w-10 h-10',
    large: 'w-12 h-12'
  };

  const iconSizes = {
    small: 16,
    default: 20,
    large: 24
  };

  return (
    <div className="flex items-center gap-2">
      {/* Microphone Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={isListening ? onStopListening : onStartListening}
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all ${
          isListening 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-[#262626] text-[#A3A3A3] hover:bg-[#363636] hover:text-white'
        }`}
        title={isListening ? 'Detener grabación' : 'Hablar'}
        data-testid="voice-mic-btn"
      >
        <AnimatePresence mode="wait">
          {isListening ? (
            <motion.div
              key="listening"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Stop size={iconSizes[size]} weight="fill" />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Microphone size={iconSizes[size]} weight="fill" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Speaker Toggle Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={isSpeaking ? onStopSpeaking : onToggleVoice}
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all ${
          isSpeaking
            ? 'bg-[#0F5257] text-white'
            : voiceEnabled
              ? 'bg-[#262626] text-[#0F5257] hover:bg-[#363636]'
              : 'bg-[#262626] text-[#A3A3A3] hover:bg-[#363636]'
        }`}
        title={isSpeaking ? 'Detener audio' : voiceEnabled ? 'Voz activada' : 'Voz desactivada'}
        data-testid="voice-speaker-btn"
      >
        <AnimatePresence mode="wait">
          {isSpeaking ? (
            <motion.div
              key="speaking"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="animate-pulse"
            >
              <Stop size={iconSizes[size]} weight="fill" />
            </motion.div>
          ) : voiceEnabled ? (
            <motion.div
              key="enabled"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <SpeakerHigh size={iconSizes[size]} weight="fill" />
            </motion.div>
          ) : (
            <motion.div
              key="disabled"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <SpeakerSlash size={iconSizes[size]} weight="regular" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default VoiceButton;
