import React from "react";
import { Button, Segmented, Tooltip } from "antd";
import { SunOutlined, MoonOutlined, DesktopOutlined } from "@ant-design/icons";
import { useTheme } from "../theme/ThemeContext";
import "./ThemeToggle.css";

/**
 * Bascule de theme.
 *
 * variant="icon"       bouton compact clair/sombre (barre de navigation)
 * variant="segmented"  choix explicite Clair / Sombre / Auto (page Profil)
 */
function ThemeToggle({ variant = "icon", className = "" }) {
  const { mode, isDark, setMode, toggle } = useTheme();

  if (variant === "segmented") {
    return (
      <Segmented
        className={`theme-segmented ${className}`.trim()}
        value={mode}
        onChange={setMode}
        options={[
          { label: "Clair", value: "light", icon: <SunOutlined /> },
          { label: "Sombre", value: "dark", icon: <MoonOutlined /> },
          { label: "Auto", value: "system", icon: <DesktopOutlined /> },
        ]}
      />
    );
  }

  return (
    <Tooltip title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}>
      <Button
        type="text"
        className={`theme-toggle-btn ${className}`.trim()}
        onClick={toggle}
        aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
        aria-pressed={isDark}
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
      />
    </Tooltip>
  );
}

export default ThemeToggle;
