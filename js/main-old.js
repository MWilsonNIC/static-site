/* -----------------------------
   Accordion (scoped, safe)
   - Supports multiple accordions per page
   - Scopes "close others" to a group
   - Optional scroll-to-trigger only when the group has [data-accordion-scroll]
-------------------------------- */
(() => {
    const items = Array.from(document.querySelectorAll("[data-accordion]"));
    if (!items.length) return;

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

    // Group rule:
    // 1) If inside a [data-accordion-group], that is the group.
    // 2) Otherwise, use the immediate parent element as the group.
    function getGroupRoot(item) {
        return item.closest("[data-accordion-group]") || item.parentElement;
    }

    function getParts(item) {
        const trigger = item.querySelector("[data-accordion-trigger]");
        const panel = item.querySelector("[data-accordion-panel]");
        const chevron = trigger ? trigger.querySelector(".chevron") : null;
        const name = item.querySelector(".js-acc-name"); // team page only
        return { trigger, panel, chevron, name };
    }

    function closeItem(item) {
        const { trigger, panel, chevron, name } = getParts(item);
        if (panel) panel.classList.add("hidden");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
        if (chevron) chevron.classList.remove("rotate-180");
        if (name) name.classList.remove("font-bold");
    }

    function openItem(item) {
        const { trigger, panel, chevron, name } = getParts(item);
        if (panel) panel.classList.remove("hidden");
        if (trigger) trigger.setAttribute("aria-expanded", "true");
        if (chevron) chevron.classList.add("rotate-180");
        if (name) name.classList.add("font-bold");
    }

    items.forEach((item) => {
        const { trigger, panel } = getParts(item);
        if (!trigger || !panel) return;

        trigger.addEventListener("click", () => {
            const groupRoot = getGroupRoot(item);
            const groupItems = items.filter((i) => getGroupRoot(i) === groupRoot);

            const isOpen = !panel.classList.contains("hidden");

            // Toggle close when clicking an open item
            if (isOpen) {
                closeItem(item);
                return;
            }

            // Close others in the same group, then open this one
            groupItems.forEach((other) => closeItem(other));
            openItem(item);

            // Only scroll if this accordion group opts in
            if (groupRoot && groupRoot.hasAttribute("data-accordion-scroll")) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => scrollTriggerToTop(trigger));
                });
            }
        });
    });
})();

/* -----------------------------
   Tabs (scoped, safe)
   - Supports multiple tab sets per page
   - Scopes to each [role="tablist"]
   - Ignores responsive tabs triggers/panels
-------------------------------- */
(() => {
    const tablists = Array.from(document.querySelectorAll('[role="tablist"]'));
    if (!tablists.length) return;

    tablists.forEach((tablist) => {
        const tabs = Array.from(
            tablist.querySelectorAll('[role="tab"]:not([data-rt-trigger])'),
        );
        if (!tabs.length) return;

        const panels = tabs
            .map((t) => {
                const id = t.getAttribute("aria-controls");
                return id ? document.getElementById(id) : null;
            })
            .filter(Boolean);

        if (!panels.length) return;

        function activate(tab) {
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
        }

        tabs.forEach((tab) => tab.addEventListener("click", () => activate(tab)));

        // Ensure one tab is active on load
        const selected = tabs.find((t) => t.getAttribute("aria-selected") === "true");
        activate(selected || tabs[0]);
    });
})();

/* -----------------------------
   Responsive section:
   accordion below md, tabs at md+ (scoped, safe)
   Requires:
   - wrapper: [data-responsive-tabs]
   - triggers: [data-rt-trigger] with aria-controls="panel-id"
   - panels: [data-rt-panel] with matching id
-------------------------------- */
(() => {
    const BREAKPOINT = "(min-width: 768px)"; // Tailwind md
    const roots = Array.from(document.querySelectorAll("[data-responsive-tabs]"));
    if (!roots.length) return;

    roots.forEach((root) => {
        const triggers = Array.from(root.querySelectorAll("[data-rt-trigger]"));
        const panels = Array.from(root.querySelectorAll("[data-rt-panel]"));
        if (!triggers.length || !panels.length) return;

        const mq = window.matchMedia(BREAKPOINT);

        function idxFromTrigger(btn) {
            const id = btn.getAttribute("aria-controls");
            return panels.findIndex((p) => p.id === id);
        }

        function currentOpenIndex() {
            return panels.findIndex((p) => !p.classList.contains("hidden"));
        }

        function setActive(index, allowNone) {
            const isMdUp = mq.matches;

            triggers.forEach((btn, i) => {
                const selected = i === index;

                if (isMdUp) {
                    btn.setAttribute("role", "tab");
                    btn.setAttribute("aria-selected", selected ? "true" : "false");
                    btn.setAttribute("tabindex", selected ? "0" : "-1");
                    btn.removeAttribute("aria-expanded");
                } else {
                    btn.removeAttribute("role");
                    btn.removeAttribute("aria-selected");
                    btn.removeAttribute("tabindex");
                    btn.setAttribute("aria-expanded", selected ? "true" : "false");
                }

                btn.toggleAttribute("data-active", selected);
            });

            panels.forEach((panel, i) => {
                const selected = i === index;

                if (isMdUp) {
                    panel.setAttribute("role", "tabpanel");
                    panel.classList.toggle("hidden", !selected);
                } else {
                    panel.removeAttribute("role");

                    if (allowNone && index === -1) panel.classList.add("hidden");
                    else panel.classList.toggle("hidden", !selected);
                }
            });
        }

        triggers.forEach((btn) => {
            btn.addEventListener("click", () => {
                const idx = idxFromTrigger(btn);
                if (idx === -1) return;

                if (mq.matches) {
                    setActive(idx, false);
                    return;
                }

                const openIdx = currentOpenIndex();
                if (openIdx === idx) setActive(-1, true);
                else setActive(idx, true);
            });
        });

        root.addEventListener("keydown", (e) => {
            if (!mq.matches) return;

            const activeEl = document.activeElement;
            if (!activeEl || !activeEl.matches("[data-rt-trigger]")) return;

            const i = triggers.indexOf(activeEl);
            if (i === -1) return;

            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const dir = e.key === "ArrowRight" ? 1 : -1;
                const next = (i + dir + triggers.length) % triggers.length;
                triggers[next].focus();
                setActive(next, false);
            }
        });

        function syncOnResize() {
            const openIdx = currentOpenIndex();
            if (mq.matches) setActive(openIdx >= 0 ? openIdx : 0, false);
            else setActive(openIdx >= 0 ? openIdx : -1, true);
        }

        if (mq.addEventListener) mq.addEventListener("change", syncOnResize);
        syncOnResize();
    });
})();

/* -----------------------------
   Desktop + mobile menu button (safe guards)
-------------------------------- */
(() => {
    const popover = document.getElementById("mega-menu__popover");
    const desktopButton = document.getElementById("menu-toggle-desktop");
    const mobileButton = document.getElementById("menu-toggle-mobile");
    if (!popover || !desktopButton || !mobileButton) return;

    const mobileIcon = mobileButton.querySelector("i");

    popover.addEventListener("toggle", (event) => {
        const isOpen = event.newState === "open";

        desktopButton.textContent = isOpen ? "X" : "Menu";
        desktopButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");

        if (mobileIcon) {
            mobileIcon.classList.toggle("fa-bars", !isOpen);
            mobileIcon.classList.toggle("fa-xmark", isOpen);
        }

        mobileButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });
})();

/* -----------------------------
   Dark Mode (unchanged, safe)
-------------------------------- */
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