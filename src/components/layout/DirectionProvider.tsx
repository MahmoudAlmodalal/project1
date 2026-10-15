"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Locale = "ar" | "en";
export type Direction = "rtl" | "ltr";

interface DirectionContextValue {
  locale: Locale;
  direction: Direction;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (arText: string, enText: string) => string;
}

const DirectionContext = createContext<DirectionContextValue | undefined>(undefined);

const STORAGE_KEY = "borrowhub_locale";

export function DirectionProvider({
  children,
  defaultLocale = "ar",
}: {
  children: React.ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && (saved === "ar" || saved === "en")) {
        setLocaleState(saved);
      }
    } catch {
      // localStorage may be disabled or unavailable
    }
  }, []);

  const direction: Direction = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    // Update HTML root attributes
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore
    }
  }, [locale, direction]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  const toggleLocale = () => {
    setLocaleState((prev) => (prev === "ar" ? "en" : "ar"));
  };

  const t = (arText: string, enText: string) => {
    return locale === "ar" ? arText : enText;
  };

  return (
    <DirectionContext.Provider
      value={{
        locale,
        direction,
        setLocale,
        toggleLocale,
        t,
      }}
    >
      {children}
    </DirectionContext.Provider>
  );
}

export function useDirection() {
  const context = useContext(DirectionContext);
  if (!context) {
    throw new Error("useDirection must be used within a DirectionProvider");
  }
  return context;
}
