// Generic Dialog (modal) component.
// Markup contract: see templates/components/overlay/dialog.html
//
// Not currently wired into any real workflow (no existing page needs a
// confirmation/modal interaction) -- this is a design-system primitive,
// exercised on the /ui-preview/ page. Opening/closing is driven by
// [data-ui-dialog-open="<id>"] triggers and [data-ui-dialog-close].
import { onEscape, trapFocusOpen, restoreFocus } from "./overlay-utils.js";

const restores = new WeakMap();

function openDialog(dialog) {
    dialog.hidden = false;
    dialog.setAttribute("aria-hidden", "false");
    document.body.classList.add("ui-dialog-open");
    const previouslyFocused = trapFocusOpen(dialog);
    const stopEscape = onEscape(() => closeDialog(dialog));
    restores.set(dialog, { previouslyFocused, stopEscape });
}

function closeDialog(dialog) {
    dialog.hidden = true;
    dialog.setAttribute("aria-hidden", "true");
    document.body.classList.remove("ui-dialog-open");
    const state = restores.get(dialog);
    if (state) {
        state.stopEscape();
        restoreFocus(state.previouslyFocused);
        restores.delete(dialog);
    }
}

document.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-ui-dialog-open]");
    if (opener) {
        const dialog = document.getElementById(opener.getAttribute("data-ui-dialog-open"));
        if (dialog) openDialog(dialog);
        return;
    }
    const closer = event.target.closest("[data-ui-dialog-close]");
    if (closer) {
        const dialog = closer.closest("[data-ui-dialog]");
        if (dialog) closeDialog(dialog);
        return;
    }
    // Click on the overlay backdrop itself (not its content panel) closes.
    const overlay = event.target.closest("[data-ui-dialog]");
    if (overlay && event.target === overlay) {
        closeDialog(overlay);
    }
});
