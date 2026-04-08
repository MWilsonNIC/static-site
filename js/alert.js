// Today at MARS panels
(() => {
    function initTodayPanel() {
        const panel = document.getElementById("today-panel");
        const panelContent = document.getElementById("today-panel-content");

        const btnAlerts = document.getElementById("toggle-alert");
        const btnHours = document.getElementById("toggle-hours");

        const tplAlerts = document.getElementById("tpl-alerts");
        const tplHours = document.getElementById("tpl-hours");

        // Only the base panel is truly required
        if (!panel || !panelContent) return;

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
            if (!templateEl || !triggerBtn) return;

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

        if (btnAlerts && tplAlerts) {
            btnAlerts.addEventListener("click", () => openPanel(tplAlerts, btnAlerts));
        }

        if (btnHours && tplHours) {
            btnHours.addEventListener("click", () => openPanel(tplHours, btnHours));
        }

        document.addEventListener("click", (e) => {
            if (!isShowingAlt) return;

            const clickedInsidePanel = panel.contains(e.target);
            const clickedAlertTrigger = btnAlerts ? btnAlerts.contains(e.target) : false;
            const clickedHoursTrigger = btnHours ? btnHours.contains(e.target) : false;

            if (clickedInsidePanel || clickedAlertTrigger || clickedHoursTrigger) return;

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