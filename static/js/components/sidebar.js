// Mobile off-canvas sidebar toggle. Delegated on `document` so it keeps
// working regardless of load order relative to the elements it controls.
document.addEventListener("click", (event) => {
    const toggle = event.target.closest("#app-sidebar-toggle");
    const mobileSidebar = document.getElementById("app-sidebar-mobile");
    if (!mobileSidebar) return;

    if (toggle) {
        mobileSidebar.classList.remove("hidden");
        toggle.setAttribute("aria-expanded", "true");
        return;
    }

    if (event.target.closest("[data-sidebar-close]")) {
        mobileSidebar.classList.add("hidden");
        const openToggle = document.getElementById("app-sidebar-toggle");
        if (openToggle) openToggle.setAttribute("aria-expanded", "false");
    }
});
