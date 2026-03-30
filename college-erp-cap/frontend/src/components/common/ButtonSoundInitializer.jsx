import { useEffect, useContext } from "react";
import { ButtonSoundContext } from "../../context/ButtonSoundContext";

/**
 * Component to initialize global button click sounds
 * Add this to your main layout or app initialization
 */
export const ButtonSoundInitializer = () => {
  const context = useContext(ButtonSoundContext);

  useEffect(() => {
    if (!context) return;

    const { playClickSound } = context;

    // Add click sound to all button elements
    const handleButtonClick = (event) => {
      // Only play sound for actual button clicks (not from event delegation issues)
      if (
        event.target.tagName === "BUTTON" ||
        event.target.closest("button")
      ) {
        playClickSound();
      }
    };

    // Add listener to document for button clicks
    document.addEventListener("click", handleButtonClick, true);

    return () => {
      document.removeEventListener("click", handleButtonClick, true);
    };
  }, [context]);

  return null; // This component doesn't render anything
};

export default ButtonSoundInitializer;
