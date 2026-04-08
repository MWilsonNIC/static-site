const admissionsDataState = {
    species: [],
    sortKey: "count",
    sortDirection: "desc",
};

let admissionsDataPromise = null;

function getAdmissionsData() {
    if (!admissionsDataPromise) {
        admissionsDataPromise = fetch("data.json").then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to load data.json: ${response.status}`);
            }

            return response.json();
        });
    }

    return admissionsDataPromise;
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
        }))
    );
}

function formatPercent(value, total) {
    const percent = (value / total) * 100;

    if (percent < 1) {
        return "<1%";
    }

    return `${Math.round(percent)}%`;
}

function sortSpecies(species, sortKey, direction) {
    const sorted = [...species];

    sorted.sort((a, b) => {
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
            admissionsDataState.sortDirection === "asc" ? "ascending" : "descending"
        );
    });

    arrows.forEach((arrow) => {
        const sortKey = arrow.dataset.sortArrow;

        if (sortKey !== admissionsDataState.sortKey) {
            arrow.textContent = "";
            return;
        }

        arrow.textContent = admissionsDataState.sortDirection === "asc" ? "↑" : "↓";
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

        row.append(speciesCell, categoryCell, countCell);
        fragment.append(row);
    });

    tbody.replaceChildren(fragment);
    updateSortUI();
}

function attachSortHandlers() {
    const buttons = document.querySelectorAll("[data-sort-button]");

    buttons.forEach((button) => {
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

    if (!chartContainer || typeof d3 === "undefined") {
        return;
    }

    chartContainer.replaceChildren();

    const grandTotal = chartData.reduce((sum, item) => sum + item.value, 0);
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
        .attr("aria-label", "Pie chart showing wildlife patients by category");

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
        sliceLabels.style("opacity", (d) => (d.data.label === label ? 1 : 0.35));

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
        cell.colSpan = 3;
        cell.className = "p-3";
        cell.textContent = "Unable to load species data.";

        row.append(cell);
        tableBody.replaceChildren(row);
    }
}

async function initAdmissionsData() {
    const root = document.getElementById("admissions-data");

    if (!root) {
        return;
    }

    try {
        const data = await getAdmissionsData();
        const chartData = getChartData(data);

        admissionsDataState.species = getSpeciesData(data);

        renderPieChart(chartData);
        renderSpeciesTable();
        attachSortHandlers();
    } catch (error) {
        console.error("Error loading admissions data:", error);
        showAdmissionsDataError();
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdmissionsData, {
        once: true,
    });
} else {
    initAdmissionsData();
}