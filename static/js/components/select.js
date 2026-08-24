// Custom accessible Select (listbox) component.
// Markup contract: see templates/components/primitives/select.html
//
// Event delegation on `document` means this works for any [data-ui-select]
// present at load time AND any inserted later (e.g. by HTMX) -- no manual
// re-initialization call is needed.
import { onClickOutside, onEscape } from "./overlay-utils.js";

const OPEN_CLASS = "is-open";
const closers = new WeakMap();

function closeSelect(root) {
    const trigger = root.querySelector("[data-ui-select-trigger]");
    const listbox = root.querySelector("[data-ui-select-listbox]");
    root.classList.remove(OPEN_CLASS);
    trigger.setAttribute("aria-expanded", "false");
    listbox.hidden = true;
    const cleanup = closers.get(root);
    if (cleanup) {
        cleanup();
        closers.delete(root);
    }
}

function openSelect(root) {
    const trigger = root.querySelector("[data-ui-select-trigger]");
    const listbox = root.querySelector("[data-ui-select-listbox]");
    root.classList.add(OPEN_CLASS);
    trigger.setAttribute("aria-expanded", "true");
    listbox.hidden = false;

    const active = listbox.querySelector('[aria-selected="true"]') || listbox.querySelector("[role=option]");
    if (active) active.focus();

    const stopOutside = onClickOutside(root, () => closeSelect(root));
    const stopEscape = onEscape(() => {
        closeSelect(root);
        trigger.focus();
    });
    closers.set(root, () => {
        stopOutside();
        stopEscape();
    });
}

function selectOption(root, option) {
    const trigger = root.querySelector("[data-ui-select-trigger]");
    const listbox = root.querySelector("[data-ui-select-listbox]");
    const valueLabel = trigger.querySelector("[data-ui-select-label]");
    const hiddenInput = root.querySelector("[data-ui-select-input]");

    listbox.querySelectorAll('[role="option"]').forEach((el) => el.setAttribute("aria-selected", "false"));
    option.setAttribute("aria-selected", "true");

    valueLabel.textContent = option.textContent.trim();
    hiddenInput.value = option.dataset.value;
    hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));

    closeSelect(root);
    trigger.focus();
}

function moveActive(listbox, delta) {
    const options = Array.from(listbox.querySelectorAll('[role="option"]:not([aria-disabled="true"])'));
    if (!options.length) return;
    const currentIndex = options.indexOf(document.activeElement);
    const nextIndex = currentIndex === -1
        ? 0
        : (currentIndex + delta + options.length) % options.length;
    options[nextIndex].focus();
}

document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-ui-select-trigger]");
    if (trigger) {
        const root = trigger.closest("[data-ui-select]");
        if (root.classList.contains("is-disabled")) return;
        if (root.classList.contains(OPEN_CLASS)) {
            closeSelect(root);
        } else {
            openSelect(root);
        }
        return;
    }

    const option = event.target.closest('[role="option"]');
    if (option && option.getAttribute("aria-disabled") !== "true") {
        const root = option.closest("[data-ui-select]");
        selectOption(root, option);
    }
});

document.addEventListener("keydown", (event) => {
    const root = event.target.closest("[data-ui-select]");
    if (!root) return;

    const trigger = root.querySelector("[data-ui-select-trigger]");
    const listbox = root.querySelector("[data-ui-select-listbox]");
    const isOpen = root.classList.contains(OPEN_CLASS);

    if (event.target === trigger) {
        if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
            event.preventDefault();
            if (!isOpen) openSelect(root);
            else if (event.key === "ArrowDown") moveActive(listbox, 1);
            else if (event.key === "ArrowUp") moveActive(listbox, -1);
        }
        return;
    }

    if (event.target.getAttribute("role") === "option") {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            moveActive(listbox, 1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveActive(listbox, -1);
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectOption(root, event.target);
        }
    }
});
