import Script from "next/script";

const themeScript = `
(() => {
  try {
    const stored = localStorage.getItem("homeplate-theme") || "system";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored === "dark" || (stored === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.dataset.theme = stored;
  } catch {
    document.documentElement.dataset.theme = "system";
  }
})();
`;

export function ThemeScript() {
  return (
    <Script
      id="homeplate-theme"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  );
}
