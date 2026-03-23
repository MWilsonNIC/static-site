async function drawWildlifePieChart() {
    const container = d3.select("#wildlife-pie-chart");
    if (container.empty()) return;

    try {
        const response = await fetch("data.json");
        const rawData = await response.json();

        const wildlifePieData = rawData.map(group => {
            const total = group.patients.reduce((sum, patient) => sum + patient.count, 0);

            return {
                label: group.category,
                value: total,
                drawValue: group.drawValue ?? total,
                color: group.color
            };
        });

        const grandTotal = wildlifePieData.reduce((sum, item) => sum + item.value, 0);

        container.selectAll("*").remove();

        const width = 320;
        const height = 320;
        const radius = Math.min(width, height) / 2;
        const innerRadius = 70;

        const svg = container
            .append("svg")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("width", "100%")
            .attr("height", "auto")
            .attr("role", "img")
            .attr("aria-label", "Pie chart showing wildlife patients by category");

        const chart = svg
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        const pie = d3.pie()
            .sort(null)
            .value(d => d.drawValue);

        const arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(radius);

        const labelArc = d3.arc()
            .innerRadius(radius - 38)
            .outerRadius(radius - 38);

        const arcs = chart
            .selectAll(".arc")
            .data(pie(wildlifePieData))
            .enter()
            .append("g")
            .attr("class", "arc");

        arcs
            .append("path")
            .attr("d", arc)
            .style("fill", d => d.data.color);

        arcs
            .append("text")
            .attr("transform", d => `translate(${labelArc.centroid(d)})`)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("fill", "#ffffff")
            .style("font-family", "var(--font-body)")
            .style("font-size", "12px")
            .style("font-weight", "700")
            .text(d => d.data.value);

        chart
            .append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .style("font-family", "var(--font-body)")
            .style("font-size", "20px")
            .style("font-weight", "700")
            .style("fill", "var(--color-moss-700)")
            .text(grandTotal);
    } catch (error) {
        console.error("Error loading pie chart data:", error);
    }
}

drawWildlifePieChart();