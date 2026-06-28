import { createContext, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "mediavault.settings";

const defaultSettings = {
  reopenAddAfterSave: true,
  useImageNameByDefault: true,
};

const SettingsContext = createContext(null);

const loadSettings = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultSettings, ...saved };
  } catch {
    return defaultSettings;
  }
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(loadSettings);

  const updateSetting = (name, value) => {
    setSettings((current) => {
      const next = { ...current, [name]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const value = useMemo(() => ({ settings, updateSetting }), [settings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider.");
  }

  return context;
};
