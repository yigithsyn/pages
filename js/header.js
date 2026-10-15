export function initializeHeader({ addPage, downloadJson, openImport, printPages, setOrientation }) {
    const orientationButtons = document.querySelectorAll("[data-orientation]");

    document.getElementById("addPage").addEventListener("click", addPage);
    document.getElementById("downloadJson").addEventListener("click", downloadJson);
    document.getElementById("importJson").addEventListener("click", openImport);
    document.getElementById("printPages").addEventListener("click", printPages);
    orientationButtons.forEach(button => {
        button.addEventListener("click", () => setOrientation(button.dataset.orientation));
    });

    const root = document.documentElement;
    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = themeToggle.querySelector(".bi");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme(theme) {
        root.dataset.bsTheme = theme;
        const next = theme === "dark" ? "light" : "dark";
        themeIcon.className = `bi ${theme === "dark" ? "bi-sun" : "bi-moon-stars"}`;
        themeToggle.setAttribute("aria-label", `Switch to ${next} mode`);
        themeToggle.title = `Switch to ${next} mode`;
    }

    applyTheme(root.dataset.bsTheme);
    themeToggle.addEventListener("click", () => {
        const theme = root.dataset.bsTheme === "dark" ? "light" : "dark";
        localStorage.setItem("theme", theme);
        applyTheme(theme);
    });
    systemDark.addEventListener("change", event => {
        if (!localStorage.getItem("theme")) applyTheme(event.matches ? "dark" : "light");
    });
}
