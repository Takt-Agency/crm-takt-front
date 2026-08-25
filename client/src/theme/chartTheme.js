/**
 * Palette des graphiques Recharts.
 *
 * Pourquoi un objet JS plutot que les variables CSS de theme.css :
 * Recharts pose ses couleurs en attributs de presentation SVG
 * (stroke="..." / fill="..."). Les attributs ne sont pas du CSS, donc
 * var(--x) n'y est jamais resolu et le trait sortirait noir. Les valeurs
 * doivent donc etre litterales et choisies cote JS.
 *
 * Garder ces valeurs alignees sur les jetons equivalents de theme.css.
 */
export const getChartTheme = (isDark) =>
  isDark
    ? {
        series: {
          pink: "#ff4da3",
          cyan: "#4fd2ff",
          indigo: "#8b9bff",
          green: "#34d399",
          yellow: "#ffc44d",
        },
        grid: "#223d4e",
        axis: "#93aebd",
        axisLine: "#2e5468",
        tooltip: {
          background: "#162c3a",
          border: "1px solid #2e5468",
          borderRadius: 10,
          color: "#e8f3f9",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.45)",
        },
        legend: "#93aebd",
      }
    : {
        series: {
          pink: "#ff1f8f",
          cyan: "#37c6f5",
          indigo: "#7082ff",
          green: "#24b47e",
          yellow: "#fdb022",
        },
        grid: "#d7e4ec",
        axis: "#5f7986",
        axisLine: "#bed2de",
        tooltip: {
          background: "#ffffff",
          border: "1px solid #d7e4ec",
          borderRadius: 10,
          color: "#0e3444",
          boxShadow: "0 4px 16px rgba(12, 65, 84, 0.08)",
        },
        legend: "#5f7986",
      };
