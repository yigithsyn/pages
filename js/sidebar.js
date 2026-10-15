import { Drawer } from "../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";

export function initializeSidebar() {
    const desktop = window.matchMedia("(min-width: 768px)");
    const sidebar = document.getElementById("sidebar");
    const toggle = document.getElementById("sidebarToggle");
    const sidebarLogo = document.getElementById("sidebarLogo");
    const sidebarBack = document.getElementById("sidebarBack");
    const drawer = Drawer.getOrCreateInstance(sidebar);

    toggle.addEventListener("click", () => {
        if (desktop.matches) {
            sidebar.classList.toggle("sidebar-collapsed");
            syncToggle();
        } else {
            drawer.toggle();
        }
    });
    sidebarBack.addEventListener("click", () => {
        sidebar.classList.add("sidebar-collapsed");
        syncToggle();
    });
    sidebarLogo.addEventListener("click", () => {
        if (!desktop.matches) return;
        sidebar.classList.remove("sidebar-collapsed");
        syncToggle();
    });
    sidebar.addEventListener("shown.bs.drawer", syncToggle);
    sidebar.addEventListener("hidden.bs.drawer", syncToggle);
    desktop.addEventListener("change", syncToggle);

    function syncToggle() {
        const expanded = desktop.matches
            ? !sidebar.classList.contains("sidebar-collapsed")
            : sidebar.open;
        toggle.setAttribute("aria-expanded", expanded);
        toggle.setAttribute("aria-label", expanded ? "Collapse sidebar" : "Expand sidebar");
        toggle.title = expanded ? "Collapse sidebar" : "Expand sidebar";
    }

    syncToggle();
}
