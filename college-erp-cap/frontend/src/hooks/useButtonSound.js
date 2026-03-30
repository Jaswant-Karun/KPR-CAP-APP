import { useContext, useCallback } from "react";
import { ButtonSoundContext } from "../context/ButtonSoundContext";

/**
 * Hook to use button sound functionality
 * Usage:
 *   const { playClickSound } = useButtonSound();
 *   
 *   // In onClick handler
 *   onClick={(e) => {
 *     playClickSound();
 *     // ... rest of your handler
 *   }}
 */
export const useButtonSound = () => {
  const context = useContext(ButtonSoundContext);

  if (!context) {
    throw new Error("useButtonSound must be used within ButtonSoundProvider");
  }

  const { playClickSound } = context;

  // Return a wrapped version that can be called without arguments
  return {
    playClickSound: useCallback(() => {
      playClickSound();
    }, [playClickSound]),
  };
};

/**
 * Hook to get current button sound enabled status
 */
export const useIsSoundEnabled = () => {
  const context = useContext(ButtonSoundContext);

  if (!context) {
    throw new Error("useIsSoundEnabled must be used within ButtonSoundProvider");
  }

  return context.soundEnabled;
};
