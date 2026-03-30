import React, { createContext, useState, useEffect } from "react";

export const ButtonSoundContext = createContext();

const STORAGE_KEY = "kpr_admin_settings";

export const ButtonSoundProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load sound setting from localStorage on mount
  useEffect(() => {
    const loadSoundSetting = () => {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        setSoundEnabled(stored.buttonSoundEnabled ?? true);
      } catch (error) {
        console.warn("Failed to load button sound setting:", error);
        setSoundEnabled(true);
      }
    };

    loadSoundSetting();

    // Listen for storage changes (when settings are updated in another tab/window)
    const handleStorageChange = () => {
      loadSoundSetting();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Watch for changes in admin settings
  useEffect(() => {
    const handleSettingsUpdate = () => {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        setSoundEnabled(stored.buttonSoundEnabled ?? true);
      } catch (error) {
        console.warn("Failed to reload button sound setting:", error);
      }
    };

    // Custom event listener for manual setting updates
    window.addEventListener("admin-settings-updated", handleSettingsUpdate);
    return () => window.removeEventListener("admin-settings-updated", handleSettingsUpdate);
  }, []);

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
