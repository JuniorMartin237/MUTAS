import { useCallback, useRef } from 'react';

export const useSound = () => {
  const audioContext = useRef(null);

  const playBeep = useCallback((type = 'success') => {
    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const context = audioContext.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.type = 'sine';
      let frequency = 880;
      let duration = 0.2;
      
      if (type === 'success') {
        frequency = 880;
        duration = 0.2;
      } else if (type === 'error') {
        frequency = 440;
        duration = 0.3;
      } else if (type === 'notification') {
        frequency = 660;
        duration = 0.15;
      }
      
      oscillator.frequency.value = frequency;
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.5);
      }, duration * 1000);
    } catch (e) {
      console.log('Web Audio API non supportée');
    }
  }, []);

  return { playBeep };
};