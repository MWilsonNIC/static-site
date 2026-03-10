// Today at MARS panels
(() => {
    function initTodayPanel() {
        const requiredIds = [
            "today-panel",
            "today-panel-content",
            "toggle-alert",
            "toggle-hours",
            "tpl-alerts",
            "tpl-hours",
        ];

        const els = Object.fromEntries(
            requiredIds.map((id) => [id, document.getElementById(id)])
        );

        const missing = requiredIds.filter((id) => !els[id]);
        if (missing.length) {
            // Quiet exit so other pages/scripts keep working
            return;
            // If you want debug info sometimes, use this instead:
            // console.warn("Today panel script: missing IDs:", missing);
        }

        const panel = els["today-panel"];
        const panelContent = els["today-panel-content"];

        const btnAlerts = els["toggle-alert"];
        const btnHours = els["toggle-hours"];

        const tplAlerts = els["tpl-alerts"];
        const tplHours = els["tpl-hours"];

        const defaultHTML = panelContent.innerHTML;

        let isShowingAlt = false;
        let lastTrigger = null;

        let locked = false;

        function lockPanelHeight() {
            if (locked) return;
            const h = panel.getBoundingClientRect().height;
            panel.style.height = `${h}px`;
            locked = true;
        }

        function unlockPanelHeight() {
            panel.style.height = "";
            locked = false;
        }

        function closePanel() {
            panelContent.innerHTML = defaultHTML;
            isShowingAlt = false;

            unlockPanelHeight();

            if (lastTrigger) lastTrigger.focus();
            lastTrigger = null;
        }

        function openPanel(templateEl, triggerBtn) {
            if (isShowingAlt && lastTrigger === triggerBtn) {
                closePanel();
                return;
            }

            lockPanelHeight();

            panelContent.innerHTML = "";
            panelContent.append(templateEl.content.cloneNode(true));

            isShowingAlt = true;
            lastTrigger = triggerBtn;

            const closeBtn = panelContent.querySelector(".js-panel-close");
            if (closeBtn) {
                closeBtn.addEventListener("click", closePanel);
                closeBtn.focus();
            }
        }

        btnAlerts.addEventListener("click", () => openPanel(tplAlerts, btnAlerts));
        btnHours.addEventListener("click", () => openPanel(tplHours, btnHours));

        document.addEventListener("click", (e) => {
            if (!isShowingAlt) return;

            const clickedInsidePanel = panel.contains(e.target);
            const clickedTrigger =
                btnAlerts.contains(e.target) || btnHours.contains(e.target);

            if (clickedInsidePanel || clickedTrigger) return;

            closePanel();
        });

        document.addEventListener("keydown", (e) => {
            if (!isShowingAlt) return;
            if (e.key === "Escape") closePanel();
        });

        window.addEventListener("resize", () => {
            if (!isShowingAlt) return;
            unlockPanelHeight();
            lockPanelHeight();
        });
    }

    document.addEventListener("DOMContentLoaded", initTodayPanel);
})();
