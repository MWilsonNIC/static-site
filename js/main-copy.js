//Navigation accordion
// const accordionItems = document.querySelectorAll("[data-accordion]");

// function getStickyHeaderOffset() {
//     const header = document.querySelector("header");
//     if (!header) return 0;

//     const pos = getComputedStyle(header).position;
//     const isStickyOrFixed = pos === "sticky" || pos === "fixed";

//     return isStickyOrFixed ? header.getBoundingClientRect().height : 0;
// }

// function scrollTriggerToTop(trigger) {
//     const offset = getStickyHeaderOffset();
//     const y = trigger.getBoundingClientRect().top + window.scrollY - offset - 12;

//     window.scrollTo({
//         top: Math.max(0, y),
//         behavior: "smooth",
//     });
// }

// accordionItems.forEach((item) => {
//     const trigger = item.querySelector("[data-accordion-trigger]");
//     const panel = item.querySelector("[data-accordion-panel]");
//     if (!trigger || !panel) return;

//     const chevron = trigger.querySelector(".chevron");

//     trigger.addEventListener("click", () => {
//         const isOpen = !panel.classList.contains("hidden");

//         accordionItems.forEach((otherItem) => {
//             const otherTrigger = otherItem.querySelector("[data-accordion-trigger]");
//             const otherPanel = otherItem.querySelector("[data-accordion-panel]");
//             const otherChevron = otherItem.querySelector(".chevron");

//             if (otherPanel) otherPanel.classList.add("hidden");
//             if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
//             if (otherChevron) otherChevron.classList.remove("rotate-180");
//         });

//         if (!isOpen) {
//             panel.classList.remove("hidden");
//             trigger.setAttribute("aria-expanded", "true");
//             if (chevron) chevron.classList.add("rotate-180");

//             requestAnimationFrame(() => {
//                 requestAnimationFrame(() => {
//                     scrollTriggerToTop(trigger);
//                 });
//             });
//         }
//     });
// });

//Navigation accordion
const accordionItems = document.querySelectorAll("[data-accordion]");

function getStickyHeaderOffset() {
    const header = document.querySelector("header");
    if (!header) return 0;

    const pos = getComputedStyle(header).position;
    const isStickyOrFixed = pos === "sticky" || pos === "fixed";

    return isStickyOrFixed ? header.getBoundingClientRect().height : 0;
}

function scrollTriggerToTop(trigger) {
    const offset = getStickyHeaderOffset();
    const y = trigger.getBoundingClientRect().top + window.scrollY - offset - 12;

    window.scrollTo({
        top: Math.max(0, y),
        behavior: "smooth",
    });
}

accordionItems.forEach((item) => {
    const trigger = item.querySelector("[data-accordion-trigger]");
    const panel = item.querySelector("[data-accordion-panel]");
    if (!trigger || !panel) return;

    const chevron = trigger.querySelector(".chevron");

    trigger.addEventListener("click", () => {
        const isOpen = !panel.classList.contains("hidden");

        accordionItems.forEach((otherItem) => {
            const otherTrigger = otherItem.querySelector("[data-accordion-trigger]");
            const otherPanel = otherItem.querySelector("[data-accordion-panel]");
            const otherChevron = otherItem.querySelector(".chevron");

            // added: remove bold from any accordion item that has a name span
            const otherName = otherItem.querySelector(".js-acc-name");
            if (otherName) otherName.classList.remove("font-bold");

            if (otherPanel) otherPanel.classList.add("hidden");
            if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
            if (otherChevron) otherChevron.classList.remove("rotate-180");
        });

        if (!isOpen) {
            panel.classList.remove("hidden");
            trigger.setAttribute("aria-expanded", "true");
            if (chevron) chevron.classList.add("rotate-180");

            // added: bold the clicked item name if it exists
            const name = item.querySelector(".js-acc-name");
            if (name) name.classList.add("font-bold");

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    scrollTriggerToTop(trigger);
                });
            });
        }
    });
});


// Tabs
// const tabs = document.querySelectorAll('[role="tab"]');
// const panels = document.querySelectorAll('[role="tabpanel"]');

// tabs.forEach((tab) => {
//     tab.addEventListener("click", () => {
//         tabs.forEach((t) => {
//             t.setAttribute("aria-selected", "false");
//             t.classList.remove("border-black");
//             t.classList.add("border-transparent");
//         });

//         panels.forEach((panel) => (panel.hidden = true));

//         tab.setAttribute("aria-selected", "true");
//         tab.classList.remove("border-transparent");
//         tab.classList.add("border-stone-500");

//         const panelId = tab.getAttribute("aria-controls");
//         document.getElementById(panelId).hidden = false;
//     });
// });

// Tabs (safe)
(() => {
    const tabs = document.querySelectorAll('[role="tab"]');
    const panels = document.querySelectorAll('[role="tabpanel"]');
    if (!tabs.length || !panels.length) return;

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((t) => {
                t.setAttribute("aria-selected", "false");
                t.classList.remove("border-stone-500");
                t.classList.add("border-transparent");
            });

            panels.forEach((p) => (p.hidden = true));

            tab.setAttribute("aria-selected", "true");
            tab.classList.remove("border-transparent");
            tab.classList.add("border-stone-500");

            const panelId = tab.getAttribute("aria-controls");
            const panel = panelId ? document.getElementById(panelId) : null;
            if (panel) panel.hidden = false;
        });
    });
})();

// Desktop Menu Button
const popover = document.getElementById("mega-menu__popover");
const desktopButton = document.getElementById("menu-toggle-desktop");
const mobileButton = document.getElementById("menu-toggle-mobile");
const mobileIcon = mobileButton.querySelector("i");

popover.addEventListener("toggle", (event) => {
    const isOpen = event.newState === "open";

    desktopButton.textContent = isOpen ? "X" : "Menu";
    desktopButton.setAttribute(
        "aria-label",
        isOpen ? "Close menu" : "Open menu",
    );

    mobileIcon.classList.toggle("fa-bars", !isOpen);
    mobileIcon.classList.toggle("fa-xmark", isOpen);

    mobileButton.setAttribute(
        "aria-label",
        isOpen ? "Close menu" : "Open menu",
    );
});

// Dark Mode
(() => {
    const STORAGE_KEY = "theme";
    const root = document.documentElement;

    const systemPrefersDark = () =>
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

    function applyTheme(theme) {
        if (theme === "dark") root.setAttribute("data-theme", "dark");
        else root.removeAttribute("data-theme");
    }

    function getSavedTheme() {
        return localStorage.getItem(STORAGE_KEY);
    }

    function saveTheme(theme) {
        localStorage.setItem(STORAGE_KEY, theme);
    }

    const saved = getSavedTheme();
    const initialTheme = saved ?? (systemPrefersDark() ? "dark" : "light");
    applyTheme(initialTheme);

    window.addEventListener("DOMContentLoaded", () => {
        const toggle = document.getElementById("theme-toggle");
        if (!toggle) return;

        toggle.checked = root.getAttribute("data-theme") === "dark";

        toggle.addEventListener("change", () => {
            const theme = toggle.checked ? "dark" : "light";
            applyTheme(theme);
            saveTheme(theme);
        });
    });
})();

