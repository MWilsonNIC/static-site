(() => {
    const admissionsDataTabs = {
        "year-to-date": {
            label: "Year-to-date Wildlife Patients",
            dataUrl: "data-ytd.json",
        },
        "last-year": {
            label: "2025 Wildlife Patients",
            dataUrl: "data.json",
        },
    };

    const admissionsDataState = {
        activeTab: "year-to-date",
        species: [],
        sortKey: "count",
        sortDirection: "desc",
    };

    const admissionsDataPromises = new Map();

    function getAdmissionsData(dataUrl) {
        if (!admissionsDataPromises.has(dataUrl)) {
            const dataPromise = fetch(dataUrl).then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${dataUrl}: ${response.status}`);
                }

                return response.json();
            });

            admissionsDataPromises.set(dataUrl, dataPromise);
        }

        return admissionsDataPromises.get(dataUrl);
    }

    function getChartData(data) {
        return data.map((group) => {
            const total = group.patients.reduce(
                (sum, patient) => sum + patient.count,
                0
            );

            return {
                label: group.category,
                value: total,
                drawValue: group.drawValue ?? total,
                color: group.color,
            };
        });
    }

    function getSpeciesData(data) {
        return data.flatMap((group) =>
            group.patients.map((patient) => ({
                name: patient.name,
                count: patient.count,
                category: group.category,
                color: group.color,
                bcListStatus: patient.bcListStatus ?? null,
                statusDotGroup: patient.statusDotGroup ?? "moss",
                statusDotLabel:
                    patient.statusDotLabel ??
                    "BC status not confirmed; using Other status",
            }))
        );
    }

    function formatPercent(value, total) {
        if (total === 0) {
            return "0%";
        }

        const percent = (value / total) * 100;

        if (percent < 1) {
            return "<1%";
        }

        return `${Math.round(percent)}%`;
    }

    function getStatusBadgeData(species) {
        const statusGroup = species.statusDotGroup;
        const bcListStatus = String(species.bcListStatus ?? "").toLowerCase();

        if (statusGroup === "hotpink" || bcListStatus.includes("red")) {
            return {
                letter: "T",
                sortValue: 0,
                label:
                    species.statusDotLabel ??
                    "Threatened: BC Red-listed species",
            };
        }

        if (statusGroup === "lake" || bcListStatus.includes("blue")) {
            return {
                letter: "V",
                sortValue: 1,
                label:
                    species.statusDotLabel ??
                    "Vulnerable: BC Blue-listed species",
            };
        }

        return null;
    }

    function getStatusSortValue(species) {
        return getStatusBadgeData(species)?.sortValue ?? 2;
    }

    function sortSpecies(species, sortKey, direction) {
        const sorted = [...species];

        sorted.sort((a, b) => {
            if (sortKey === "status") {
                const aStatusBadgeData = getStatusBadgeData(a);
                const bStatusBadgeData = getStatusBadgeData(b);
                const aHasStatusBadge = Boolean(aStatusBadgeData);
                const bHasStatusBadge = Boolean(bStatusBadgeData);

                if (aHasStatusBadge !== bHasStatusBadge) {
                    return aHasStatusBadge ? -1 : 1;
                }

                const statusCompare = getStatusSortValue(a) - getStatusSortValue(b);

                if (statusCompare !== 0) {
                    return direction === "asc" ? statusCompare : -statusCompare;
                }

                const nameCompare = a.name.localeCompare(b.name);

                if (nameCompare !== 0) {
                    return nameCompare;
                }

                return b.count - a.count;
            }

            if (sortKey === "species") {
                const nameCompare = a.name.localeCompare(b.name);

                if (nameCompare !== 0) {
                    return direction === "asc" ? nameCompare : -nameCompare;
                }

                return b.count - a.count;
            }

            if (sortKey === "category") {
                const categoryCompare = a.category.localeCompare(b.category);

                if (categoryCompare !== 0) {
                    return direction === "asc" ? categoryCompare : -categoryCompare;
                }

                const countCompare = b.count - a.count;

                if (countCompare !== 0) {
                    return countCompare;
                }

                return a.name.localeCompare(b.name);
            }

            const countCompare = a.count - b.count;

            if (countCompare !== 0) {
                return direction === "asc" ? countCompare : -countCompare;
            }

            return a.name.localeCompare(b.name);
        });

        return sorted;
    }

    function updateSortUI() {
        const headers = document.querySelectorAll("[data-sort-button]");
        const arrows = document.querySelectorAll("[data-sort-arrow]");

        headers.forEach((button) => {
            const sortKey = button.dataset.sortButton;
            const th = button.closest("th");

            if (!th) {
                return;
            }

            if (sortKey !== admissionsDataState.sortKey) {
                th.setAttribute("aria-sort", "none");
                return;
            }

            th.setAttribute(
                "aria-sort",
                admissionsDataState.sortDirection === "asc"
                    ? "ascending"
                    : "descending"
            );
        });

        arrows.forEach((arrow) => {
            const sortKey = arrow.dataset.sortArrow;

            if (sortKey !== admissionsDataState.sortKey) {
                arrow.textContent = "";
                return;
            }

            arrow.textContent =
                admissionsDataState.sortDirection === "asc" ? "↑" : "↓";
        });
    }

    function renderSpeciesTable() {
        const tbody = document.getElementById("species-table-body");

        if (!tbody) {
            return;
        }

        const sortedSpecies = sortSpecies(
            admissionsDataState.species,
            admissionsDataState.sortKey,
            admissionsDataState.sortDirection
        );

        const fragment = document.createDocumentFragment();

        sortedSpecies.forEach((species) => {
            const row = document.createElement("tr");
            row.className = "border-b border-stone-300";

            const statusCell = document.createElement("td");
            statusCell.className = "p-3 text-center align-middle";

            const statusBadgeData = getStatusBadgeData(species);

            if (statusBadgeData) {
                const statusBadge = document.createElement("span");
                statusBadge.className =
                    "inline-flex size-7 items-center justify-center rounded-full border border-stone-300 bg-stone-100 text-xs font-bold";
                statusBadge.textContent = statusBadgeData.letter;
                statusBadge.setAttribute("role", "img");
                statusBadge.setAttribute("aria-label", statusBadgeData.label);

                statusCell.append(statusBadge);
            }

            const speciesCell = document.createElement("td");
            speciesCell.className = "p-3 pr-4 font-medium";
            speciesCell.textContent = species.name;

            const categoryCell = document.createElement("td");
            categoryCell.className = "p-3 pr-4";

            const categoryText = document.createElement("span");
            categoryText.className = "font-bold";
            categoryText.textContent = species.category;
            categoryText.style.color = species.color;

            categoryCell.append(categoryText);

            const countCell = document.createElement("td");
            countCell.className = "p-3 text-right whitespace-nowrap";
            countCell.textContent = String(species.count);

            row.append(statusCell, speciesCell, categoryCell, countCell);
            fragment.append(row);
        });

        tbody.replaceChildren(fragment);
        updateSortUI();
    }

    function attachSortHandlers() {
        const buttons = document.querySelectorAll("[data-sort-button]");

        buttons.forEach((button) => {
            if (button.dataset.sortBound === "true") {
                return;
            }

            button.dataset.sortBound = "true";

            button.addEventListener("click", () => {
                const clickedKey = button.dataset.sortButton;

                if (clickedKey === admissionsDataState.sortKey) {
                    admissionsDataState.sortDirection =
                        admissionsDataState.sortDirection === "asc" ? "desc" : "asc";
                } else {
                    admissionsDataState.sortKey = clickedKey;
                    admissionsDataState.sortDirection =
                        clickedKey === "count" ? "desc" : "asc";
                }

                renderSpeciesTable();
            });
        });
    }

    function setSummaryButtonState(button, isActive) {
        button.style.opacity = isActive ? "1" : "0.45";
        button.style.textDecoration = isActive ? "underline" : "none";
    }

    function renderSummaryList(chartData, grandTotal, onHighlight, onClear) {
        const list = document.getElementById("wildlife-summary-list");
        const total = document.getElementById("wildlife-summary-total");

        if (!list) {
            return new Map();
        }

        const buttonMap = new Map();
        const fragment = document.createDocumentFragment();

        chartData.forEach((item) => {
            const listItem = document.createElement("li");
            listItem.className = "pt-2";

            const button = document.createElement("button");
            button.type = "button";
            button.className =
                "block w-full rounded-sm text-left text-xl font-bold tracking-wide cursor-pointer focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2";
            button.textContent = `${item.label}: ${item.value} (${formatPercent(
                item.value,
                grandTotal
            )})`;
            button.style.color = item.color;
            button.style.textUnderlineOffset = "4px";

            button.addEventListener("focus", () => onHighlight(item.label));
            button.addEventListener("blur", onClear);

            listItem.addEventListener("mouseenter", () => onHighlight(item.label));
            listItem.addEventListener("mouseleave", onClear);

            listItem.append(button);
            fragment.append(listItem);
            buttonMap.set(item.label, button);
        });

        list.replaceChildren(fragment);

        if (total) {
            total.textContent = `Total: ${grandTotal}`;
        }

        return buttonMap;
    }

    function renderPieChart(chartData) {
        const chartContainer = document.getElementById("wildlife-pie-chart");

        if (!chartContainer) {
            return;
        }

        chartContainer.replaceChildren();

        const grandTotal = chartData.reduce((sum, item) => sum + item.value, 0);

        if (typeof d3 === "undefined") {
            const message = document.createElement("p");
            message.textContent = "Unable to load chart library.";
            chartContainer.append(message);

            renderSummaryList(chartData, grandTotal, () => { }, () => { });
            return;
        }

        const width = 320;
        const height = 320;
        const radius = Math.min(width, height) / 2;
        const innerRadius = 70;

        const svg = d3
            .select(chartContainer)
            .append("svg")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("width", "100%")
            .attr("height", "auto")
            .attr("role", "img")
            .attr(
                "aria-label",
                "Pie chart showing wildlife patients by category"
            );

        const chart = svg
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        const pie = d3
            .pie()
            .sort(null)
            .value((d) => d.drawValue);

        const pieData = pie(chartData);

        const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius);

        const labelArc = d3
            .arc()
            .innerRadius(radius - 38)
            .outerRadius(radius - 38);

        const arcs = chart
            .selectAll(".arc")
            .data(pieData)
            .enter()
            .append("g")
            .attr("class", "arc")
            .attr("data-label", (d) => d.data.label);

        const paths = arcs
            .append("path")
            .attr("d", arc)
            .attr("fill", (d) => d.data.color)
            .style("cursor", "pointer")
            .style("opacity", 1)
            .style("transition", "opacity 0.15s ease");

        const sliceLabels = arcs
            .append("text")
            .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("fill", "#ffffff")
            .style("font-family", "var(--font-body)")
            .style("font-size", "12px")
            .style("font-weight", "700")
            .style("pointer-events", "none")
            .style("transition", "opacity 0.15s ease")
            .text((d) => d.data.value);

        chart
            .append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .style("fill", "var(--color-moss-700)")
            .style("font-family", "var(--font-body)")
            .style("font-size", "20px")
            .style("font-weight", "700")
            .text(grandTotal);

        let summaryButtons = new Map();
        let clearTimeoutId = null;

        function cancelClearHighlight() {
            if (clearTimeoutId) {
                window.clearTimeout(clearTimeoutId);
                clearTimeoutId = null;
            }
        }

        function clearHighlightNow() {
            paths.style("opacity", 1);
            sliceLabels.style("opacity", 1);

            summaryButtons.forEach((button) => {
                button.style.opacity = "1";
                button.style.textDecoration = "none";
            });
        }

        function scheduleClearHighlight() {
            cancelClearHighlight();

            clearTimeoutId = window.setTimeout(() => {
                clearHighlightNow();
                clearTimeoutId = null;
            }, 40);
        }

        function highlightCategory(label) {
            cancelClearHighlight();

            paths.style("opacity", (d) => (d.data.label === label ? 1 : 0.35));

            sliceLabels.style("opacity", (d) =>
                d.data.label === label ? 1 : 0.35
            );

            summaryButtons.forEach((button, key) => {
                setSummaryButtonState(button, key === label);
            });
        }

        summaryButtons = renderSummaryList(
            chartData,
            grandTotal,
            highlightCategory,
            scheduleClearHighlight
        );

        arcs
            .on("mouseenter", (_, d) => highlightCategory(d.data.label))
            .on("mouseleave", scheduleClearHighlight);
    }

    function showAdmissionsDataLoading() {
        const chartContainer = document.getElementById("wildlife-pie-chart");
        const summaryList = document.getElementById("wildlife-summary-list");
        const summaryTotal = document.getElementById("wildlife-summary-total");
        const tableBody = document.getElementById("species-table-body");

        if (chartContainer) {
            chartContainer.innerHTML = "<p>Loading chart data...</p>";
        }

        if (summaryList) {
            summaryList.replaceChildren();
        }

        if (summaryTotal) {
            summaryTotal.textContent = "";
        }

        if (tableBody) {
            const row = document.createElement("tr");
            row.className = "border-b border-stone-300";

            const cell = document.createElement("td");
            cell.colSpan = 4;
            cell.className = "p-3";
            cell.textContent = "Loading species data...";

            row.append(cell);
            tableBody.replaceChildren(row);
        }
    }

    function showAdmissionsDataError() {
        const chartContainer = document.getElementById("wildlife-pie-chart");
        const summaryList = document.getElementById("wildlife-summary-list");
        const summaryTotal = document.getElementById("wildlife-summary-total");
        const tableBody = document.getElementById("species-table-body");

        if (chartContainer) {
            chartContainer.innerHTML = "<p>Unable to load chart data.</p>";
        }

        if (summaryList) {
            summaryList.replaceChildren();
        }

        if (summaryTotal) {
            summaryTotal.textContent = "";
        }

        if (tableBody) {
            const row = document.createElement("tr");
            row.className = "border-b border-stone-300";

            const cell = document.createElement("td");
            cell.colSpan = 4;
            cell.className = "p-3";
            cell.textContent = "Unable to load species data.";

            row.append(cell);
            tableBody.replaceChildren(row);
        }
    }

    function updateAdmissionsHeading(tabConfig) {
        const heading = document.getElementById("admissions-data-heading");

        if (heading) {
            heading.textContent = tabConfig.label;
        }
    }

    function updateAdmissionsTabUI(activeTabKey) {
        const buttons = document.querySelectorAll("[data-admissions-tab]");
        const panel = document.getElementById("admissions-data-panel");

        buttons.forEach((button) => {
            const isActive = button.dataset.admissionsTab === activeTabKey;

            button.dataset.active = String(isActive);
            button.setAttribute("aria-selected", String(isActive));
            button.setAttribute("tabindex", isActive ? "0" : "-1");

            button.classList.toggle("border-stone-500", isActive);
            button.classList.toggle("border-transparent", !isActive);

            if (isActive && panel) {
                panel.setAttribute("aria-labelledby", button.id);
            }
        });
    }

    async function renderAdmissionsData(tabKey) {
        const tabConfig = admissionsDataTabs[tabKey];

        if (!tabConfig) {
            return;
        }

        admissionsDataState.activeTab = tabKey;

        updateAdmissionsTabUI(tabKey);
        updateAdmissionsHeading(tabConfig);
        showAdmissionsDataLoading();

        try {
            const data = await getAdmissionsData(tabConfig.dataUrl);
            const chartData = getChartData(data);

            admissionsDataState.species = getSpeciesData(data);

            renderPieChart(chartData);
            renderSpeciesTable();
        } catch (error) {
            console.error("Error loading admissions data:", error);
            showAdmissionsDataError();
        }
    }

    function attachAdmissionsTabHandlers() {
        const buttons = Array.from(
            document.querySelectorAll("[data-admissions-tab]")
        );

        if (!buttons.length) {
            return;
        }

        buttons.forEach((button, index) => {
            if (button.dataset.admissionsTabBound === "true") {
                return;
            }

            button.dataset.admissionsTabBound = "true";

            button.addEventListener("click", () => {
                renderAdmissionsData(button.dataset.admissionsTab);
            });

            button.addEventListener("keydown", (event) => {
                const isHorizontalKey =
                    event.key === "ArrowLeft" || event.key === "ArrowRight";
                const isEdgeKey = event.key === "Home" || event.key === "End";

                if (!isHorizontalKey && !isEdgeKey) {
                    return;
                }

                event.preventDefault();

                let nextIndex = index;

                if (event.key === "ArrowRight") {
                    nextIndex = (index + 1) % buttons.length;
                }

                if (event.key === "ArrowLeft") {
                    nextIndex = (index - 1 + buttons.length) % buttons.length;
                }

                if (event.key === "Home") {
                    nextIndex = 0;
                }

                if (event.key === "End") {
                    nextIndex = buttons.length - 1;
                }

                const nextButton = buttons[nextIndex];

                nextButton.focus();
                renderAdmissionsData(nextButton.dataset.admissionsTab);
            });
        });
    }

    function getInitialTabKey() {
        const selectedButton = document.querySelector(
            "[data-admissions-tab][aria-selected='true']"
        );

        if (
            selectedButton &&
            admissionsDataTabs[selectedButton.dataset.admissionsTab]
        ) {
            return selectedButton.dataset.admissionsTab;
        }

        return admissionsDataState.activeTab;
    }

    function initAdmissionsData() {
        const root = document.getElementById("admissions-data");

        if (!root) {
            return;
        }

        attachSortHandlers();
        attachAdmissionsTabHandlers();
        renderAdmissionsData(getInitialTabKey());
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAdmissionsData, {
            once: true,
        });
    } else {
        initAdmissionsData();
    }
})();