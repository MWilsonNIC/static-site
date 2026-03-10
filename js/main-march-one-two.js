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
    const roots = document.querySelectorAll("[data-rt]");
    if (!roots.length) return;

    const toTabsMQ = window.matchMedia("(min-width: 768px)");

    roots.forEach((root) => {
        const triggers = Array.from(root.querySelectorAll("[data-rt-trigger]"));
        if (!triggers.length) return;

        const panels = triggers
            .map((btn) => {
                const id = btn.getAttribute("aria-controls");
                return id ? root.querySelector(`#${CSS.escape(id)}[data-rt-panel]`) : null;
            })
            .filter(Boolean);

        if (!panels.length) return;

        let activeIndex = panels.findIndex((p) => !p.hidden);
        if (activeIndex < 0) activeIndex = 0;

        function setActive(nextIndex, { focus = false } = {}) {
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
                    chevron.classList.toggle(
                        "rotate-180",
                        !toTabsMQ.matches && isActive,
                    );
                }

                if (focus && isActive) btn.focus();
            });

            panels.forEach((panel, i) => {
                panel.hidden = i !== activeIndex;
            });
        }

        function applyMode() {
            const toTabs = toTabsMQ.matches;

            if (toTabs) {
                if (activeIndex < 0) activeIndex = 0;

                root.setAttribute("role", "tablist");
                triggers.forEach((btn) => btn.setAttribute("role", "tab"));
                panels.forEach((panel) => panel.setAttribute("role", "tabpanel"));

                setActive(activeIndex);
            } else {
                root.removeAttribute("role");
                triggers.forEach((btn) => btn.removeAttribute("role"));
                panels.forEach((panel) => panel.removeAttribute("role"));

                setActive(activeIndex);
            }
        }

        triggers.forEach((btn, i) => {
            btn.addEventListener("click", () => {
                if (toTabsMQ.matches) {
                    if (i !== activeIndex) setActive(i, { focus: false });
                    return;
                }

                if (i === activeIndex) {
                    activeIndex = -1;

                    triggers.forEach((b) => {
                        b.dataset.active = "false";
                        b.setAttribute("aria-expanded", "false");
                        const chevron = b.querySelector(".chevron");
                        if (chevron) chevron.classList.remove("rotate-180");
                    });

                    panels.forEach((p) => (p.hidden = true));
                } else {
                    setActive(i, { focus: false });
                }
            });

            btn.addEventListener("keydown", (e) => {
                if (!toTabsMQ.matches) return;

                if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                e.preventDefault();

                const dir = e.key === "ArrowRight" ? 1 : -1;
                const next = (activeIndex + dir + triggers.length) % triggers.length;
                setActive(next, { focus: true });
            });
        });

        applyMode();
        toTabsMQ.addEventListener("change", applyMode);
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
