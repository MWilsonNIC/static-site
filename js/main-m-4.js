// Accordion groups

(() => {
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

    function initAccordionGroup(groupRoot, { scrollOnOpen = false } = {}) {
        const items = Array.from(groupRoot.querySelectorAll("[data-accordion]"));
        if (!items.length) return;

        function closeItem(item) {
            const trigger = item.querySelector("[data-accordion-trigger]");
            const panel = item.querySelector("[data-accordion-panel]");
            const chevron = trigger ? trigger.querySelector(".chevron") : null;
            const name = item.querySelector(".js-acc-name");

            if (panel) panel.classList.add("hidden");
            if (trigger) trigger.setAttribute("aria-expanded", "false");
            if (chevron) chevron.classList.remove("rotate-180");
            if (name) name.classList.remove("font-bold");
        }

        function openItem(item) {
            const trigger = item.querySelector("[data-accordion-trigger]");
            const panel = item.querySelector("[data-accordion-panel]");
            const chevron = trigger ? trigger.querySelector(".chevron") : null;
            const name = item.querySelector(".js-acc-name");

            if (panel) panel.classList.remove("hidden");
            if (trigger) trigger.setAttribute("aria-expanded", "true");
            if (chevron) chevron.classList.add("rotate-180");
            if (name) name.classList.add("font-bold");

            if (scrollOnOpen && trigger) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        scrollTriggerToTop(trigger);
                    });
                });
            }
        }

        items.forEach((item) => {
            const trigger = item.querySelector("[data-accordion-trigger]");
            const panel = item.querySelector("[data-accordion-panel]");
            if (!trigger || !panel) return;

            if (!trigger.hasAttribute("aria-expanded")) {
                trigger.setAttribute(
                    "aria-expanded",
                    panel.classList.contains("hidden") ? "false" : "true",
                );
            }

            trigger.addEventListener("click", () => {
                const isOpen = !panel.classList.contains("hidden");

                items.forEach((other) => {
                    if (other !== item) closeItem(other);
                });

                if (isOpen) closeItem(item);
                else openItem(item);
            });
        });
    }

    const navPopover = document.getElementById("mega-menu__popover");

    function getGroupRoot(item) {
        if (navPopover && navPopover.contains(item)) return navPopover;

        const explicitGroup = item.closest("[data-accordion-group]");
        if (explicitGroup) return explicitGroup;

        const main = item.closest("main");
        if (main) return main;

        return document.body;
    }

    const groups = new Map();
    document.querySelectorAll("[data-accordion]").forEach((item) => {
        const groupRoot = getGroupRoot(item);
        if (!groups.has(groupRoot)) groups.set(groupRoot, []);
        groups.get(groupRoot).push(item);
    });

    groups.forEach((items, groupRoot) => {
        const scrollOnOpen =
            groupRoot !== navPopover && groupRoot.hasAttribute("data-accordion-scroll");

        initAccordionGroup(groupRoot, { scrollOnOpen });
    });
})();


(() => {
    const roots = Array.from(document.querySelectorAll("[data-rt]"));
    if (!roots.length) return;

    const toTabsMQ = window.matchMedia("(min-width: 768px)");

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

    roots.forEach((root) => {
        const triggers = Array.from(root.querySelectorAll("[data-rt-trigger]"))
            .filter((btn) => btn.closest("[data-rt]") === root);
        if (!triggers.length) return;

        const panels = triggers
            .map((btn) => {
                const id = btn.getAttribute("aria-controls");
                if (!id) return null;

                const panel = root.querySelector(`#${CSS.escape(id)}[data-rt-panel]`);
                if (!panel) return null;
                if (panel.closest("[data-rt]") !== root) return null;

                return panel;
            })
            .filter(Boolean);

        if (!panels.length) return;

        const shouldScrollOnMobileOpen = root.hasAttribute("data-rt-scroll");
        let activeIndex = -1; // mobile default: all closed until clicked
        let currentMode = null;

        function setTriggerLabelBold(btn, isActive) {
            const label = btn.querySelector(".js-acc-name");
            const target = label || btn;
            target.classList.toggle("font-bold", !toTabsMQ.matches && isActive);
        }

        function closeAllMobile() {
            activeIndex = -1;

            triggers.forEach((btn) => {
                btn.dataset.active = "false";
                btn.setAttribute("aria-expanded", "false");
                btn.removeAttribute("aria-selected");
                btn.setAttribute("tabindex", "0");
                setTriggerLabelBold(btn, false);

                const chevron = btn.querySelector(".chevron");
                if (chevron) chevron.classList.remove("rotate-180");
            });

            panels.forEach((p) => (p.hidden = true));
        }

        function setActive(nextIndex, { focus = false, scroll = false } = {}) {
            activeIndex = nextIndex;

            triggers.forEach((btn, i) => {
                const isActive = i === activeIndex;
                const chevron = btn.querySelector(".chevron");

                btn.dataset.active = isActive ? "true" : "false";

                if (toTabsMQ.matches) {
                    btn.setAttribute("aria-selected", isActive ? "true" : "false");
                    btn.setAttribute("tabindex", isActive ? "0" : "-1");
                    btn.removeAttribute("aria-expanded");
                } else {
                    btn.setAttribute("aria-expanded", isActive ? "true" : "false");
                    btn.removeAttribute("aria-selected");
                    btn.setAttribute("tabindex", "0");
                }

                if (chevron) {
                    chevron.classList.toggle("rotate-180", !toTabsMQ.matches && isActive);
                }

                setTriggerLabelBold(btn, isActive);

                if (focus && isActive) btn.focus();
            });

            panels.forEach((panel, i) => {
                panel.hidden = i !== activeIndex;
            });

            if (scroll && shouldScrollOnMobileOpen && !toTabsMQ.matches) {
                const activeTrigger = triggers[activeIndex];
                if (activeTrigger) {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            scrollTriggerToTop(activeTrigger);
                        });
                    });
                }
            }
        }

        function applyMode() {
            const toTabs = toTabsMQ.matches;
            const nextMode = toTabs ? "tabs" : "mobile";

            if (toTabs) {
                root.setAttribute("role", "tablist");
                triggers.forEach((btn) => btn.setAttribute("role", "tab"));
                panels.forEach((panel) => panel.setAttribute("role", "tabpanel"));

                if (activeIndex < 0) activeIndex = 0;
                setActive(activeIndex);
            } else {
                root.removeAttribute("role");
                triggers.forEach((btn) => btn.removeAttribute("role"));
                panels.forEach((panel) => panel.removeAttribute("role"));

                // Match standard accordion behavior on mobile: start closed,
                // and reset to closed when returning from desktop tabs.
                if (currentMode !== "mobile") {
                    closeAllMobile();
                } else if (activeIndex < 0) {
                    closeAllMobile();
                } else {
                    setActive(activeIndex);
                }
            }

            currentMode = nextMode;
        }

        triggers.forEach((btn, i) => {
            if (btn.dataset.rtBound === "true") return;
            btn.dataset.rtBound = "true";

            btn.addEventListener("click", () => {
                if (toTabsMQ.matches) {
                    if (i !== activeIndex) setActive(i, { focus: false });
                    return;
                }

                if (i === activeIndex) {
                    closeAllMobile();
                } else {
                    setActive(i, { focus: false, scroll: true });
                }
            });

            btn.addEventListener("keydown", (e) => {
                if (!toTabsMQ.matches) return;
                if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

                e.preventDefault();

                const dir = e.key === "ArrowRight" ? 1 : -1;
                const baseIndex = activeIndex < 0 ? 0 : activeIndex;
                const next = (baseIndex + dir + triggers.length) % triggers.length;
                setActive(next, { focus: true });
            });
        });

        applyMode();

        if (!root._rtChangeHandlerBound) {
            const handler = () => applyMode();
            toTabsMQ.addEventListener("change", handler);
            root._rtChangeHandlerBound = true;
        }
    });
})();

// Desktop Menu Button
(() => {
    const popover = document.getElementById("mega-menu__popover");
    const desktopButton = document.getElementById("menu-toggle-desktop");
    const mobileButton = document.getElementById("menu-toggle-mobile");

    if (!popover || !desktopButton || !mobileButton) return;

    const mobileIcon = mobileButton.querySelector("i");

    popover.addEventListener("toggle", (event) => {
        const isOpen = event.newState === "open";

        desktopButton.textContent = isOpen ? "X" : "Menu";
        desktopButton.setAttribute(
            "aria-label",
            isOpen ? "Close menu" : "Open menu",
        );

        if (mobileIcon) {
            mobileIcon.classList.toggle("fa-bars", !isOpen);
            mobileIcon.classList.toggle("fa-xmark", isOpen);
        }

        mobileButton.setAttribute(
            "aria-label",
            isOpen ? "Close menu" : "Open menu",
        );
    });
})();

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
