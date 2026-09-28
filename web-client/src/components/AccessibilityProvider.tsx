"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface AccessibilitySettings {
  highContrast: boolean;
  monochrome: boolean;
  dyslexiaFont: boolean;
  largeText: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  toggleSetting: (key: keyof AccessibilitySettings) => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  monochrome: false,
  dyslexiaFont: false,
  largeText: false,
};

const AccessibilityContext = createContext<AccessibilityContextType>({
  settings: defaultSettings,
  toggleSetting: () => {},
  resetSettings: () => {},
});

export const useAccessibility = () => useContext(AccessibilityContext);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  useEffect(() => {
    const stored = localStorage.getItem("a11y-settings");
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse a11y settings", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("a11y-settings", JSON.stringify(settings));

    const html = document.documentElement;

    if (settings.highContrast) {
      html.classList.add("a11y-high-contrast");
    } else {
      html.classList.remove("a11y-high-contrast");
    }

    if (settings.monochrome) {
      html.classList.add("a11y-monochrome");
    } else {
      html.classList.remove("a11y-monochrome");
    }

    if (settings.dyslexiaFont) {
      html.classList.add("a11y-dyslexia");
    } else {
      html.classList.remove("a11y-dyslexia");
    }

    if (settings.largeText) {
      html.classList.add("a11y-large-text");
    } else {
      html.classList.remove("a11y-large-text");
    }
  }, [settings]);

  const toggleSetting = (key: keyof AccessibilitySettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider value={{ settings, toggleSetting, resetSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
}
