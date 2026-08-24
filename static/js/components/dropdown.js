// Generic action-menu Dropdown component.
// Markup contract: see templates/components/overlay/dropdown.html
import { onClickOutside, onEscape } from "./overlay-utils.js";

const OPEN_CLASS = "is-open";
const closers = new WeakMap();

function closeMenu(root) {
    const trigger = root.querySelector("[data-ui-dropdown-trigger]");
    const menu = root.querySelector("[data-ui-dropdown-menu]");
    root.classList.remove(OPEN_CLASS);
    trigger.setAttribute("aria-expanded", "false");
    menu.hidden = true;
    const cleanup = closers.get(root);
    if (cleanup) {
        cleanup();
        closers.delete(root);
    }
}

function openMenu(root) {
    // Only one dropdown open at a time.
    document.querySelectorAll(`[data-ui-dropdown].${OPEN_CLASS}`).forEach((other) => {
        if (other !== root) closeMenu(other);
    });

    const trigger = root.querySelector("[data-ui-dropdown-trigger]");
    const menu = root.querySelector("[data-ui-dropdown-menu]");
    root.classList.add(OPEN_CLASS);
    trigger.setAttribute("aria-expanded", "true");
    menu.hidden = false;

    const firstItem = menu.querySelector('[role="menuitem"]:not([aria-disabled="true"])');
    if (firstItem) firstItem.focus();

    const stopOutside = onClickOutside(root, () => closeMenu(root));
    const stopEscape = onEscape(() => {
        closeMenu(root);
        trigger.focus();
    });
    closers.set(root, () => {
        stopOutside();
        stopEscape();
    });
}

function moveActive(menu, delta) {
    const items = Array.from(menu.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])'));
    if (!items.length) return;
    const currentIndex = items.indexOf(document.activeElement);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + delta + items.length) % items.length;
    items[nextIndex].focus();
}

document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-ui-dropdown-trigger]");
    if (trigger) {
        const root = trigger.closest("[data-ui-dropdown]");
        if (root.classList.contains(OPEN_CLASS)) closeMenu(root);
        else openMenu(root);
        return;
    }
    const item = event.target.closest('[role="menuitem"]');
    if (item) {
        const root = item.closest("[data-ui-dropdown]");
        if (root) closeMenu(root);
    }
});

document.addEventListener("keydown", (event) => {
    const root = event.target.closest("[data-ui-dropdown]");
    if (!root) return;
    const menu = root.querySelector("[data-ui-dropdown-menu]");
    const isOpen = root.classList.contains(OPEN_CLASS);

    if (event.target.hasAttribute("data-ui-dropdown-trigger")) {
        if (["ArrowDown", "Enter", " "].includes(event.key)) {
            event.preventDefault();
            if (!isOpen) openMenu(root);
            else moveActive(menu, 1);
        }
        return;
    }

    if (event.target.getAttribute("role") === "menuitem") {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            moveActive(menu, 1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveActive(menu, -1);
        }
    }
});
