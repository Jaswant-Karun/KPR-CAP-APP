import React, { createContext, useState, useEffect } from "react";
import { usePublicSettings } from "../hooks/usePublicSettings";

export const ButtonSoundContext = createContext();

export const ButtonSoundProvider = ({ children }) => {
  const { settings } = usePublicSettings();
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setSoundEnabled(settings?.buttonSoundEnabled ?? true);
  }, [settings?.buttonSoundEnabled]);

  const playClickSound = () => {
    if (!soundEnabled) return;

    try {
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;

      // Create oscillator for the click sound
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      // Click sound: short frequency sweep
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

      // Short envelope (attack and decay)
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (error) {
      console.warn("Failed to play button click sound:", error);
    }
  };

  return (
    <ButtonSoundContext.Provider value={{ soundEnabled, playClickSound }}>
      {children}
    </ButtonSoundContext.Provider>
  );
};
