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
        const mobileOpenFirst = root.hasAttribute("data-rt-mobile-open-first");

        let activeIndex = -1; // mobile default: closed (unless root opts in)
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
                    chevron.classList.toggle(
                        "rotate-180",
                        !toTabsMQ.matches && isActive,
                    );
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

                if (currentMode !== "mobile") {
                    if (mobileOpenFirst) setActive(0);
                    else closeAllMobile();
                } else if (activeIndex < 0) {
                    if (mobileOpenFirst) setActive(0);
                    else closeAllMobile();
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
// (() => {
//     const STORAGE_KEY = "theme";
//     const root = document.documentElement;

//     const systemPrefersDark = () =>
//         window.matchMedia &&
//         window.matchMedia("(prefers-color-scheme: dark)").matches;

//     function applyTheme(theme) {
//         if (theme === "dark") root.setAttribute("data-theme", "dark");
//         else root.removeAttribute("data-theme");
//     }

//     function getSavedTheme() {
//         return localStorage.getItem(STORAGE_KEY);
//     }

//     function saveTheme(theme) {
//         localStorage.setItem(STORAGE_KEY, theme);
//     }

//     const saved = getSavedTheme();
//     const initialTheme = saved ?? (systemPrefersDark() ? "dark" : "light");
//     applyTheme(initialTheme);

//     window.addEventListener("DOMContentLoaded", () => {
//         const toggle = document.getElementById("theme-toggle");
//         if (!toggle) return;

//         toggle.checked = root.getAttribute("data-theme") === "dark";

//         toggle.addEventListener("change", () => {
//             const theme = toggle.checked ? "dark" : "light";
//             applyTheme(theme);
//             saveTheme(theme);
//         });
//     });
// })();
(() => {
    const STORAGE_KEY = "theme";
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function getSavedTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved === "dark" || saved === "light" ? saved : null;
    }

    function saveTheme(theme) {
        localStorage.setItem(STORAGE_KEY, theme);
    }

    function applyTheme(theme) {
        if (theme === "dark") {
            root.setAttribute("data-theme", "dark");
        } else {
            root.removeAttribute("data-theme");
        }

        const toggle = document.getElementById("theme-toggle");
        if (toggle) {
            toggle.checked = theme === "dark";
        }
    }

    function getPreferredTheme() {
        const savedTheme = getSavedTheme();
        if (savedTheme) return savedTheme;
        return mediaQuery.matches ? "dark" : "light";
    }

    document.addEventListener("DOMContentLoaded", () => {
        const toggle = document.getElementById("theme-toggle");
        if (!toggle) return;

        applyTheme(getPreferredTheme());

        toggle.addEventListener("change", () => {
            const newTheme = toggle.checked ? "dark" : "light";
            applyTheme(newTheme);
            saveTheme(newTheme);
        });
    });

    // Keep following system preference until the user manually chooses a theme
    mediaQuery.addEventListener("change", (e) => {
        if (!getSavedTheme()) {
            applyTheme(e.matches ? "dark" : "light");
        }
    });
})();

// Today at Mars
document.addEventListener("DOMContentLoaded", () => {
    const dateEl = document.getElementById("today-date");
    const visitorHoursEl = document.getElementById("visitor-centre-hours");

    if (!dateEl || !visitorHoursEl) return;

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat

    const getOrdinal = (num) => {
        if (num >= 11 && num <= 13) return "th";

        switch (num % 10) {
            case 1:
                return "st";
            case 2:
                return "nd";
            case 3:
                return "rd";
            default:
                return "th";
        }
    };

    const weekday = today.toLocaleDateString("en-CA", { weekday: "long" });
    const month = today.toLocaleDateString("en-CA", { month: "long" });
    const day = today.getDate();

    dateEl.innerHTML = `<em>${weekday}, ${month} ${day}${getOrdinal(day)}</em>`;
    dateEl.setAttribute("datetime", today.toISOString().split("T")[0]);

    const visitorCentreOpen = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;

    visitorHoursEl.textContent = visitorCentreOpen ? "10:00 am - 3:00 pm" : "Closed Today";
});

// Form pages
(() => {
    const forms = Array.from(document.querySelectorAll("form[novalidate]"));
    if (!forms.length) return;

    function cleanLabelText(text) {
        return (text || "")
            .replace(/\*/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function getFieldLabel(form, field) {
        if (field.type === "radio" || field.type === "checkbox") {
            const fieldset = field.closest("fieldset");
            const legend = fieldset ? fieldset.querySelector("legend") : null;
            return cleanLabelText(legend ? legend.textContent : "This field");
        }

        if (field.id) {
            const label = form.querySelector(`label[for="${field.id}"]`);
            if (label) return cleanLabelText(label.textContent);
        }

        return cleanLabelText(field.name || "This field");
    }

    function getFieldTarget(form, field) {
        if (field.type === "radio" || field.type === "checkbox") {
            const first = form.querySelector(`input[name="${field.name}"]`);
            return first && first.id ? first.id : field.id;
        }

        return field.id;
    }

    function clearFieldError(form, field) {
        if (field.type === "radio" || field.type === "checkbox") {
            form
                .querySelectorAll(`input[name="${field.name}"]`)
                .forEach((input) => input.removeAttribute("aria-invalid"));
            return;
        }

        field.removeAttribute("aria-invalid");
    }

    function clearErrors(form, summary, errorList) {
        if (summary) summary.classList.add("hidden");
        if (errorList) errorList.innerHTML = "";

        form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
            field.removeAttribute("aria-invalid");
        });
    }

    function showErrors(form, summary, errorList, invalidFields) {
        if (!summary || !errorList) return;

        const seen = new Set();
        errorList.innerHTML = "";

        invalidFields.forEach((field) => {
            const name = getFieldLabel(form, field);
            if (seen.has(name)) return;
            seen.add(name);

            if (field.type === "radio" || field.type === "checkbox") {
                form
                    .querySelectorAll(`input[name="${field.name}"]`)
                    .forEach((input) => input.setAttribute("aria-invalid", "true"));
            } else {
                field.setAttribute("aria-invalid", "true");
            }

            const item = document.createElement("li");
            const link = document.createElement("a");
            const targetId = getFieldTarget(form, field);

            if (targetId) link.href = `#${targetId}`;

            link.className = "underline";
            link.textContent = name;
            item.appendChild(link);
            errorList.appendChild(item);
        });

        summary.classList.remove("hidden");
        summary.focus();
    }

    function getValidatableFields(form) {
        return Array.from(form.elements).filter((field) => {
            return (
                field instanceof HTMLElement &&
                !field.disabled &&
                field.type !== "hidden" &&
                field.type !== "submit" &&
                field.type !== "button" &&
                field.willValidate
            );
        });
    }

    function updateFileName(input, output) {
        if (!input || !output) return;

        output.textContent =
            input.files && input.files.length > 0
                ? input.files[0].name
                : "No file chosen";
    }

    function initFileInputs(form) {
        form.querySelectorAll('input[type="file"]').forEach((input) => {
            const describedBy = (input.getAttribute("aria-describedby") || "")
                .split(/\s+/)
                .filter(Boolean);

            let output = describedBy
                .map((id) => document.getElementById(id))
                .find((el) => el && /filename$/i.test(el.id));

            if (!output) {
                output = input.parentElement
                    ? input.parentElement.querySelector('[id$="filename"]')
                    : null;
            }

            if (!output) return;

            const sync = () => updateFileName(input, output);
            input.addEventListener("change", sync);
            sync();
        });
    }

    function initWorkExperienceInsurance() {
        const form = document.getElementById("work-experience-form");
        if (!form) return;

        const internationalInputs = form.querySelectorAll(
            'input[name="international_applicant"]',
        );
        const internationalYes = form.querySelector("#international-yes");
        const insurancePanel = form.querySelector("#insurance-panel");
        const insuranceOptions = form.querySelectorAll(".insurance-option");

        if (
            !internationalInputs.length ||
            !internationalYes ||
            !insurancePanel ||
            !insuranceOptions.length
        ) {
            return;
        }

        function updateInsurancePanel() {
            const showInsurance = internationalYes.checked;

            insurancePanel.classList.toggle("hidden", !showInsurance);
            insurancePanel.setAttribute(
                "aria-hidden",
                showInsurance ? "false" : "true",
            );

            insuranceOptions.forEach((option) => {
                option.disabled = !showInsurance;
                option.required = showInsurance;

                if (!showInsurance) {
                    option.checked = false;
                    option.removeAttribute("aria-invalid");
                }
            });
        }

        internationalInputs.forEach((input) => {
            input.addEventListener("change", updateInsurancePanel);
        });

        updateInsurancePanel();
    }

    function initMembershipFamilySection() {
        const form = document.getElementById("membership-form");
        if (!form) return;

        const familyOption = form.querySelector(
            'input[name="membership_level"][value="family"]',
        );
        const membershipOptions = form.querySelectorAll(
            'input[name="membership_level"]',
        );
        const familyHeading = Array.from(form.querySelectorAll("h2")).find((heading) =>
            /family membership details/i.test(heading.textContent),
        );
        const familySection = familyHeading ? familyHeading.closest("div") : null;

        if (!familyOption || !membershipOptions.length || !familySection) return;

        const familyFields = familySection.querySelectorAll(
            "input, select, textarea, button",
        );

        function updateFamilySection() {
            const showFamilyFields = familyOption.checked;

            familySection.classList.toggle("hidden", !showFamilyFields);
            familySection.setAttribute(
                "aria-hidden",
                showFamilyFields ? "false" : "true",
            );

            familyFields.forEach((field) => {
                field.disabled = !showFamilyFields;
                if (!showFamilyFields) field.removeAttribute("aria-invalid");
            });
        }

        membershipOptions.forEach((input) => {
            input.addEventListener("change", updateFamilySection);
        });

        updateFamilySection();
    }

    forms.forEach((form) => {
        const summary = form.parentElement
            ? form.parentElement.querySelector("#form-error-summary")
            : null;
        const errorList = summary
            ? summary.querySelector("#form-error-list")
            : null;

        initFileInputs(form);

        form.addEventListener("input", (event) => {
            const field = event.target;
            if (!(field instanceof HTMLElement)) return;
            if (!field.matches("input, select, textarea")) return;

            clearFieldError(form, field);
        });

        form.addEventListener("change", (event) => {
            const field = event.target;
            if (!(field instanceof HTMLElement)) return;
            if (!field.matches("input, select, textarea")) return;

            clearFieldError(form, field);
        });

        form.addEventListener("submit", (event) => {
            clearErrors(form, summary, errorList);

            const invalidFields = getValidatableFields(form).filter(
                (field) => !field.checkValidity(),
            );

            if (!invalidFields.length) return;

            event.preventDefault();
            showErrors(form, summary, errorList, invalidFields);
            invalidFields[0].focus();
        });
    });

    initWorkExperienceInsurance();
    initMembershipFamilySection();
})();

// Tooltips
(() => {
    const tooltips = Array.from(document.querySelectorAll("[data-tooltip]"));
    if (!tooltips.length) return;

    function closeTooltip(tooltip) {
        const trigger = tooltip.querySelector(".tooltip__trigger");
        tooltip.classList.remove("is-open");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
    }

    function openTooltip(tooltip) {
        const trigger = tooltip.querySelector(".tooltip__trigger");
        tooltip.classList.add("is-open");
        if (trigger) trigger.setAttribute("aria-expanded", "true");
    }

    tooltips.forEach((tooltip) => {
        const trigger = tooltip.querySelector(".tooltip__trigger");
        if (!trigger) return;

        trigger.addEventListener("click", (event) => {
            event.stopPropagation();

            const isOpen = tooltip.classList.contains("is-open");

            tooltips.forEach((otherTooltip) => {
                if (otherTooltip !== tooltip) closeTooltip(otherTooltip);
            });

            if (isOpen) closeTooltip(tooltip);
            else openTooltip(tooltip);
        });

        trigger.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") return;
            closeTooltip(tooltip);
            trigger.blur();
        });

        tooltip.addEventListener("focusout", (event) => {
            if (!tooltip.contains(event.relatedTarget)) {
                closeTooltip(tooltip);
            }
        });
    });

    document.addEventListener("click", (event) => {
        tooltips.forEach((tooltip) => {
            if (!tooltip.contains(event.target)) {
                closeTooltip(tooltip);
            }
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        tooltips.forEach((tooltip) => closeTooltip(tooltip));
    });
})();