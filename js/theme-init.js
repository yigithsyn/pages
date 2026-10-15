document.documentElement.dataset.bsTheme = localStorage.getItem("theme")
    || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
