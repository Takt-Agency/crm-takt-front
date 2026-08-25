import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ConfigProvider, theme as antdTheme } from "antd";
import frFR from "antd/locale/fr_FR";

const STORAGE_KEY = "nexia-theme";
const ThemeContext = createContext(null);

/** Les trois valeurs que l'utilisateur peut choisir. */
export const THEME_MODES = ["light", "dark", "system"];

const prefersDark = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const readStoredMode = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEME_MODES.includes(stored) ? stored : "system";
  } catch {
    // localStorage peut lever en navigation privee ou si les cookies
    // tiers sont bloques : on retombe sur la preference systeme.
    return "system";
  }
};

/** "system" est resolu ici pour que le CSS n'ait que deux etats a gerer. */
const resolveMode = (mode) =>
  mode === "system" ? (prefersDark() ? "dark" : "light") : mode;

/**
 * Applique le theme au document. Exporte pour que index.html puisse poser
 * l'attribut avant le premier rendu et eviter un flash de theme clair.
 */
export const applyTheme = (resolved) => {
  document.documentElement.dataset.theme = resolved;
};

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(readStoredMode);
  const [resolved, setResolved] = useState(() => resolveMode(readStoredMode()));

  // Repercute le mode choisi sur <html> et sur le stockage local.
  useEffect(() => {
    const next = resolveMode(mode);
    setResolved(next);
    applyTheme(next);

    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Preference non persistee : le theme reste actif pour la session.
    }
  }, [mode]);

  // En mode "system", suit les changements de preference de l'OS a chaud.
  useEffect(() => {
    if (mode !== "system" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      const next = event.matches ? "dark" : "light";
      setResolved(next);
      applyTheme(next);
    };

    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, [mode]);

  const setMode = useCallback((next) => {
    setModeState(THEME_MODES.includes(next) ? next : "system");
  }, []);

  const toggle = useCallback(() => {
    // Le bouton bascule entre clair et sombre de facon explicite : une fois
    // que l'utilisateur a clique, on ne revient plus au suivi de l'OS.
    setModeState(resolveMode(mode) === "dark" ? "light" : "dark");
  }, [mode]);

  const isDark = resolved === "dark";

  const antdConfig = useMemo(
    () => ({
      algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: "#ff1f8f",
        colorInfo: "#37c6f5",
        colorSuccess: "#24b47e",
        colorWarning: "#fdb022",
        colorError: "#e5484d",
        colorLink: isDark ? "#4fd2ff" : "#20b6e8",
        borderRadius: 10,
        fontFamily: '"Manrope", "Segoe UI", sans-serif',
        // Aligne les surfaces d'Ant Design sur les jetons de theme.css,
        // sinon les Card/Modal/Table flottent sur un gris different du reste.
        colorBgLayout: isDark ? "#0a1620" : "#f4f9fc",
        colorBgContainer: isDark ? "#10222e" : "#ffffff",
        colorBgElevated: isDark ? "#162c3a" : "#ffffff",
        colorBorder: isDark ? "#223d4e" : "#d7e4ec",
        colorBorderSecondary: isDark ? "#1c3242" : "#e4eef5",
        colorText: isDark ? "#e8f3f9" : "#0e3444",
        colorTextSecondary: isDark ? "#93aebd" : "#5f7986",
        colorTextTertiary: isDark ? "#6d8695" : "#8ba3b0",
      },
      components: {
        Layout: {
          headerBg: isDark ? "#10222e" : "#ffffff",
          siderBg: isDark ? "#0c1b25" : "#ffffff",
          bodyBg: isDark ? "#0a1620" : "#f4f9fc",
        },
        Menu: {
          itemBg: "transparent",
          subMenuItemBg: "transparent",
        },
        Card: {
          colorBgContainer: isDark ? "#10222e" : "#ffffff",
        },
        Table: {
          headerBg: isDark ? "#0c1b25" : "#f3f9fc",
          rowHoverBg: isDark ? "#1b3344" : "#eef6fb",
        },
      },
    }),
    [isDark],
  );

  const value = useMemo(
    () => ({ mode, resolved, isDark, setMode, toggle }),
    [mode, resolved, isDark, setMode, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider locale={frFR} theme={antdConfig}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme doit etre utilise a l'interieur de <ThemeProvider>");
  }
  return context;
}
