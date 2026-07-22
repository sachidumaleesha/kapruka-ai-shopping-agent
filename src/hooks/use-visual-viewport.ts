"use client";

import { useEffect, useState } from "react";

interface VisualViewportState {
  height: number | null;
  isKeyboardOpen: boolean;
}

const KEYBOARD_THRESHOLD = 180;
const MOBILE_INPUT_QUERY = "(pointer: coarse) and (hover: none)";

const isTextEntryFocused = () => {
  const activeElement = document.activeElement;

  return (
    activeElement instanceof HTMLElement &&
    activeElement.matches("input, textarea, [contenteditable='true']")
  );
};

export const useVisualViewport = (): VisualViewportState => {
  const [state, setState] = useState<VisualViewportState>({
    height: null,
    isKeyboardOpen: false,
  });

  useEffect(() => {
    const visualViewport = window.visualViewport;
    const mobileInput = window.matchMedia(MOBILE_INPUT_QUERY);

    if (!visualViewport) {
      return;
    }

    let animationFrame: number | null = null;

    const updateViewport = () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }

      animationFrame = requestAnimationFrame(() => {
        const height = Math.round(visualViewport.height);
        const obscuredHeight = window.screen.height - visualViewport.height;
        const isKeyboardOpen =
          isTextEntryFocused() &&
          (mobileInput.matches || obscuredHeight > KEYBOARD_THRESHOLD);

        setState((currentState) =>
          currentState.height === height &&
          currentState.isKeyboardOpen === isKeyboardOpen
            ? currentState
            : { height, isKeyboardOpen },
        );
      });
    };

    updateViewport();
    visualViewport.addEventListener("resize", updateViewport);
    visualViewport.addEventListener("scroll", updateViewport);
    window.addEventListener("focusin", updateViewport);
    window.addEventListener("focusout", updateViewport);
    window.addEventListener("orientationchange", updateViewport);
    mobileInput.addEventListener("change", updateViewport);

    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }

      visualViewport.removeEventListener("resize", updateViewport);
      visualViewport.removeEventListener("scroll", updateViewport);
      window.removeEventListener("focusin", updateViewport);
      window.removeEventListener("focusout", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
      mobileInput.removeEventListener("change", updateViewport);
    };
  }, []);

  return state;
};
