// Shared helpers for overlay-style components (dropdown menu, select, dialog).
// Plain ES module, no build step -- loaded directly via <script type="module">.

export function onClickOutside(root, handler) {
    function listener(event) {
        if (!root.contains(event.target)) handler(event);
    }
    document.addEventListener("click", listener, true);
    return () => document.removeEventListener("click", listener, true);
}

export function onEscape(handler) {
    function listener(event) {
        if (event.key === "Escape") handler(event);
    }
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
}

// Moves focus to the first focusable element inside root; returns the
// previously focused element so callers can restore it on close.
export function trapFocusOpen(root) {
    const previouslyFocused = document.activeElement;
    const focusable = root.querySelector(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) focusable.focus();
    return previouslyFocused;
}

export function restoreFocus(previouslyFocused) {
    if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
    }
}
