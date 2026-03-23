const DUMMY_DESCRIPTION = "Description unavailable.";
const DUMMY_IMAGE =
    "https://placehold.co/600x400/e7e5e4/a8a29e?text=Wildlife";

const colors = {
    background: "rgba(0, 0, 0, 0)"
};

function getCategoryColors(category) {
    switch (category) {
        case "Birds":
            return {
                category: "#B78E2E",
                subcategory: "#F5BF18",
                species: "#FFD447"
            };
        case "Amphibians":
            return {
                category: "#454522",
                subcategory: "#737438",
                species: "#B5B668"
            };
        case "Mammals":
            return {
                category: "#7C3719",
                subcategory: "#BF5428",
                species: "#E2733A"
            };
        case "Reptiles":
            return {
                category: "#7A1532",
                subcategory: "#BF204E",
                species: "#E1527B"
            };
        default:
            return {
                category: "#44403c",
                subcategory: "#78716c",
                species: "#d6d3d1"
            };
    }
}

function sizeFromCount(count) {
    return Math.max(0.6, Math.sqrt(Math.max(0, count)) * 0.35);
}

function setFixedPosition(node, x, y, z) {
    node.x = x;
    node.y = y;
    node.z = z;
    node.fx = x;
    node.fy = y;
    node.fz = z;
}

function circlePoints3D(count, radius, zAmplitude = 24) {
    if (count <= 0) return [];

    const points = [];

    for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;

        points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: i % 2 === 0 ? -zAmplitude : zAmplitude
        });
    }

    return points;
}

function fanPoints2D(
    count,
    radius,
    startAngle = -Math.PI * 0.9,
    endAngle = Math.PI * 0.3
) {
    if (count <= 0) return [];

    if (count === 1) {
        return [{ x: radius, y: 0, z: 0 }];
    }

    const points = [];
    const span = endAngle - startAngle;

    for (let i = 0; i < count; i += 1) {
        const t = i / (count - 1);
        const angle = startAngle + span * t;

        points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: (i % 2 === 0 ? 1 : -1) * Math.min(radius * 0.14, 8)
        });
    }

    return points;
}

function fibonacciSpherePoints(count, radius) {
    if (count <= 0) return [];

    if (count === 1) {
        return [{ x: radius, y: 0, z: 0 }];
    }

    if (count === 2) {
        return [
            { x: -radius, y: 0, z: 0 },
            { x: radius, y: 0, z: 0 }
        ];
    }

    const points = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i += 1) {
        const y = 1 - (i / (count - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = goldenAngle * i;

        points.push({
            x: Math.cos(theta) * r * radius,
            y: y * radius,
            z: Math.sin(theta) * r * radius
        });
    }

    return points;
}

function getSubcategoryPoints(count, radius) {
    if (count <= 6) {
        return fanPoints2D(count, radius, -Math.PI * 0.75, Math.PI * 0.15);
    }

    return fibonacciSpherePoints(count, radius);
}

function getSpeciesPoints(count, radius) {
    if (count <= 6) {
        return fanPoints2D(count, radius, -Math.PI, Math.PI * 0.4);
    }

    return fibonacciSpherePoints(count, radius);
}

function applyStructuredLayout(nodes, links) {
    const nodeById = new Map(nodes.map(node => [node.id, node]));
    const categoryToSubcategories = new Map();
    const subcategoryToPatients = new Map();

    links.forEach(link => {
        const sourceId =
            typeof link.source === "object" ? link.source.id : link.source;
        const targetId =
            typeof link.target === "object" ? link.target.id : link.target;

        const sourceNode = nodeById.get(sourceId);
        const targetNode = nodeById.get(targetId);

        if (!sourceNode || !targetNode) return;

        if (sourceNode.group === "Category" && targetNode.group === "Subcategory") {
            if (!categoryToSubcategories.has(sourceId)) {
                categoryToSubcategories.set(sourceId, []);
            }
            categoryToSubcategories.get(sourceId).push(targetNode);
        }

        if (sourceNode.group === "Subcategory" && targetNode.group === "Patient") {
            if (!subcategoryToPatients.has(sourceId)) {
                subcategoryToPatients.set(sourceId, []);
            }
            subcategoryToPatients.get(sourceId).push(targetNode);
        }
    });

    const rootNode = nodes.find(node => node.group === "Root");
    if (rootNode) {
        setFixedPosition(rootNode, 0, 0, 0);
    }

    const categoryNodes = nodes.filter(node => node.group === "Category");
    const categoryPoints = circlePoints3D(categoryNodes.length, 45, 10);

    categoryNodes.forEach((categoryNode, categoryIndex) => {
        const catPoint = categoryPoints[categoryIndex];
        setFixedPosition(categoryNode, catPoint.x, catPoint.y, catPoint.z);

        const subcategoryNodes = categoryToSubcategories.get(categoryNode.id) || [];
        const subcategoryPoints = getSubcategoryPoints(subcategoryNodes.length, 14);

        subcategoryNodes.forEach((subcategoryNode, subIndex) => {
            const subPoint = subcategoryPoints[subIndex];

            setFixedPosition(
                subcategoryNode,
                categoryNode.x + subPoint.x,
                categoryNode.y + subPoint.y,
                categoryNode.z + subPoint.z
            );

            const patientNodes = subcategoryToPatients.get(subcategoryNode.id) || [];
            const compactCategory = ["Amphibians", "Reptiles"].includes(categoryNode.name);

            const speciesRadius = compactCategory
                ? patientNodes.length <= 6
                    ? 30
                    : Math.max(26, Math.min(42, 22 + patientNodes.length))
                : patientNodes.length <= 6
                    ? 52
                    : Math.max(44, Math.min(78, 34 + patientNodes.length * 1.2));

            const patientPoints = getSpeciesPoints(patientNodes.length, speciesRadius);

            patientNodes.forEach((patientNode, patientIndex) => {
                const point = patientPoints[patientIndex];

                setFixedPosition(
                    patientNode,
                    subcategoryNode.x + point.x,
                    subcategoryNode.y + point.y,
                    subcategoryNode.z + point.z
                );
            });
        });
    });
}

function getLayoutBounds(nodes) {
    const visibleNodes = nodes.filter(node => node.group !== "Root");

    if (!visibleNodes.length) {
        return {
            center: { x: 0, y: 0, z: 0 },
            span: 100
        };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    visibleNodes.forEach(node => {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y);
        minZ = Math.min(minZ, node.z);
        maxZ = Math.max(maxZ, node.z);
    });

    return {
        center: {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2,
            z: (minZ + maxZ) / 2
        },
        span: Math.max(maxX - minX, maxY - minY, maxZ - minZ)
    };
}

function getResponsiveCameraMultiplier(container) {
    const w = container.clientWidth;

    if (w >= 1280) return 0.82;
    if (w >= 1024) return 0.9;
    if (w >= 900) return 1.02;
    if (w >= 768) return 1.14;
    if (w >= 640) return 1.24;
    return 1.34;
}

function getResponsiveMinDistance(container) {
    const w = container.clientWidth;

    if (w >= 1280) return 120;
    if (w >= 1024) return 130;
    if (w >= 768) return 145;
    return 160;
}

function getResponsiveNodeScale(container) {
    const w = container.clientWidth;

    if (w >= 1280) return 0.14;
    if (w >= 1024) return 0.135;
    if (w >= 900) return 0.13;
    if (w >= 768) return 0.12;
    if (w >= 640) return 0.115;
    return 0.11;
}

function getResponsiveLinkScale(container) {
    const w = container.clientWidth;

    if (w >= 1280) return 0.6;
    if (w >= 1024) return 0.55;
    if (w >= 900) return 0.5;
    if (w >= 768) return 0.45;
    if (w >= 640) return 0.4;
    return 0.35;
}

function getLinkWidthForDisplay(link, container) {
    const scale = getResponsiveLinkScale(container);
    const source =
        typeof link.source === "object" && link.source !== null
            ? link.source
            : null;
    const sourceId = source ? source.id : link.source;

    if (sourceId === "Root") return 0;
    if (source && source.group === "Category") return 1.5 * scale;
    if (source && source.group === "Subcategory") return 1 * scale;
    return 0.5 * scale;
}

function frameGraph(graph, nodes, container) {
    const { center, span } = getLayoutBounds(nodes);
    const multiplier = getResponsiveCameraMultiplier(container);
    const minDistance = getResponsiveMinDistance(container);
    const distance = Math.max(minDistance, span * multiplier);

    graph.cameraPosition(
        {
            x: center.x,
            y: center.y,
            z: center.z + distance
        },
        center,
        0
    );

    const controls = graph.controls();
    controls.target.set(center.x, center.y, center.z);
    controls.update();
}

function isTabletRange() {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
}

function hasHoverPointer() {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function useHoverTooltip() {
    return isTabletRange() && hasHoverPointer();
}

function useTapTooltip() {
    return isTabletRange() && !hasHoverPointer();
}

function showGraphTooltip(tooltip, node) {
    const countText =
        node.group === "Patient"
            ? `Count: ${node.count}`
            : `Total: ${node.totalPatients || node.count || 0}`;

    tooltip.innerHTML = `
    <div style="
      max-width: 240px;
      background: rgba(250, 250, 249, 0.96);
      color: #292524;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid #d6d3d1;
      box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);
      line-height: 1.4;
    ">
      <div style="
        font-size: 0.95rem;
        font-weight: 700;
        color: #44403c;
        margin-bottom: 4px;
      ">
        ${node.name}
      </div>

      <div style="
        font-size: 0.78rem;
        color: #78716c;
        margin-bottom: 6px;
      ">
        ${node.breadcrumb || ""}
      </div>

      <div style="
        font-size: 0.82rem;
        color: #57534e;
      ">
        ${countText}
      </div>
    </div>
  `;

    tooltip.classList.remove("hidden");
}

function hideGraphTooltip(tooltip) {
    tooltip.classList.add("hidden");
}

function positionGraphTooltip(tooltip, wrapper, clientX, clientY) {
    if (!tooltip || !wrapper) return;

    const wrapperRect = wrapper.getBoundingClientRect();

    let left = clientX - wrapperRect.left + 16;
    let top = clientY - wrapperRect.top + 16;

    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    const maxLeft = wrapperRect.width - tooltipWidth - 12;
    const maxTop = wrapperRect.height - tooltipHeight - 12;

    left = Math.max(12, Math.min(left, maxLeft));
    top = Math.max(12, Math.min(top, maxTop));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

function positionTapTooltip(tooltip, wrapper) {
    if (!tooltip || !wrapper) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const tooltipWidth = tooltip.offsetWidth;

    tooltip.style.left = `${Math.max(12, wrapperRect.width - tooltipWidth - 16)}px`;
    tooltip.style.top = "16px";
}

function ensureInfoPanelMarkup(infoPanel) {
    if (!infoPanel) return;

    infoPanel.innerHTML = `
        <div class="mb-4 aspect-video w-full overflow-hidden rounded-md border border-stone-300 bg-stone-200 flex items-center justify-center">
          <img
            id="animal-photo"
            src="#"
            alt=""
            class="hidden h-full w-full object-cover" />
          <span
            id="proxy-fallback-text"
            class="text-sm font-medium text-stone-400">
            Photo unavailable
          </span>
        </div>

        <h3 id="species-name" class="mb-1">Animal Name</h3>
        <p id="scientific-name" class="mb-1 text-sm italic text-stone-500 hidden"></p>
        <p id="cat-nested-name" class="mb-1 text-sm text-stone-500 hidden"></p>
        <p id="animal-meta" class="mb-3 text-sm font-medium text-stone-700"></p>
        <p id="animal-info" class="text-sm leading-relaxed text-stone-600"></p>
    `;
}

function updateInfoPanel(node) {
    const infoPanel = document.getElementById("info-panel");
    const sidebarDefault = document.getElementById("sidebar-default");

    if (!infoPanel || !sidebarDefault) return;

    if (!node || node.group === "Root") {
        infoPanel.classList.add("hidden");
        sidebarDefault.classList.remove("hidden");
        return;
    }

    sidebarDefault.classList.add("hidden");
    infoPanel.classList.remove("hidden");
    ensureInfoPanelMarkup(infoPanel);

    const speciesName = document.getElementById("species-name");
    const scientificName = document.getElementById("scientific-name");
    const catNestedName = document.getElementById("cat-nested-name");
    const animalMeta = document.getElementById("animal-meta");
    const animalInfo = document.getElementById("animal-info");
    const animalPhoto = document.getElementById("animal-photo");
    const proxyFallbackText = document.getElementById("proxy-fallback-text");

    speciesName.textContent = node.name || "";

    if (node.scientificName) {
        scientificName.textContent = node.scientificName;
        scientificName.classList.remove("hidden");
    } else {
        scientificName.textContent = "";
        scientificName.classList.add("hidden");
    }

    if (node.group === "Category") {
        catNestedName.textContent = "";
        catNestedName.classList.add("hidden");
        animalMeta.textContent = `Species count: ${node.speciesCount || 0}`;
        animalInfo.textContent =
            node.description || `Total wildlife patients in this category: ${node.totalPatients || 0}.`;
        animalPhoto.classList.add("hidden");
        proxyFallbackText.classList.remove("hidden");
        return;
    }

    if (node.group === "Subcategory") {
        if (node.breadcrumb) {
            catNestedName.textContent = node.breadcrumb;
            catNestedName.classList.remove("hidden");
        } else {
            catNestedName.textContent = "";
            catNestedName.classList.add("hidden");
        }

        animalMeta.textContent = `Species count: ${node.speciesCount || 0}`;
        animalInfo.textContent =
            node.description || "Description unavailable.";
        animalPhoto.classList.add("hidden");
        proxyFallbackText.classList.remove("hidden");
        return;
    }

    if (node.breadcrumb) {
        catNestedName.textContent = node.breadcrumb;
        catNestedName.classList.remove("hidden");
    } else {
        catNestedName.textContent = "";
        catNestedName.classList.add("hidden");
    }

    animalMeta.textContent = `Count: ${node.count || 0}`;
    animalInfo.textContent = node.description || DUMMY_DESCRIPTION;

    animalPhoto.src =
        node.img || `${DUMMY_IMAGE}&text=${encodeURIComponent(node.name)}`;
    animalPhoto.alt = node.name || "";
    animalPhoto.classList.remove("hidden");
    proxyFallbackText.classList.add("hidden");
}

function isInteractiveSpeciesNode(node) {
    return !!node && node.group === "Patient";
}

function initGraph(data) {
    const container = document.getElementById("graph-container");
    if (!container) return;

    const wrapper = container.parentElement;
    const tooltip = document.getElementById("graph-tooltip");

    let hoveredNode = null;
    let selectedNode = null;
    let lastMouseX = 0;
    let lastMouseY = 0;

    container.style.opacity = "0";

    const nodes = [];
    const links = [];
    const rootId = "Root";

    nodes.push({
        id: rootId,
        name: "",
        group: "Root",
        color: "rgba(0,0,0,0)",
        val: 0.1,
        isHub: true
    });

    const categories = Object.keys(data).map(key => ({
        category: key,
        ...data[key]
    }));

    categories.forEach(group => {
        const categoryColors = getCategoryColors(group.category);

        const totalPatients = group.subcategories.reduce((sum, subcategory) => {
            return (
                sum +
                subcategory.animals.reduce(
                    (subSum, animal) => subSum + animal.count,
                    0
                )
            );
        }, 0);

        const speciesCount = group.subcategories.reduce(
            (sum, subcategory) => sum + subcategory.animals.length,
            0
        );

        const categoryId = `Category-${group.category}`;

        nodes.push({
            id: categoryId,
            name: group.category,
            scientificName: group.scientific_name || "",
            description: group.description || "",
            group: "Category",
            color: categoryColors.category,
            val: sizeFromCount(totalPatients),
            count: totalPatients,
            totalPatients,
            speciesCount,
            tooltipText: `${group.category}, Count: ${totalPatients}`,
            breadcrumb: "",
            isHub: true
        });

        links.push({
            source: rootId,
            target: categoryId,
            color: "rgba(0,0,0,0)"
        });

        group.subcategories.forEach(subcategory => {
            const subcategoryId = `Subcat-${group.category}-${subcategory.name}`;

            const subcategoryTotal = subcategory.animals.reduce(
                (sum, animal) => sum + animal.count,
                0
            );

            nodes.push({
                id: subcategoryId,
                name: subcategory.name,
                scientificName: subcategory.scientific_name || "",
                description: subcategory.description || DUMMY_DESCRIPTION,
                group: "Subcategory",
                color: categoryColors.subcategory,
                val: sizeFromCount(subcategoryTotal),
                count: subcategoryTotal,
                totalPatients: subcategoryTotal,
                speciesCount: subcategory.animals.length,
                tooltipText: `${subcategory.name}, ${group.category} > ${subcategory.name}, Count: ${subcategoryTotal}`,
                breadcrumb: group.category,
                isHub: true
            });

            links.push({
                source: categoryId,
                target: subcategoryId,
                color: categoryColors.subcategory
            });

            subcategory.animals.forEach(animal => {
                nodes.push({
                    id: animal.name,
                    name: animal.name,
                    scientificName: animal.scientific_name || "",
                    description: animal.description || DUMMY_DESCRIPTION,
                    group: "Patient",
                    color: categoryColors.species,
                    val: sizeFromCount(animal.count),
                    count: animal.count,
                    img: animal.image || null,
                    tooltipText: `${animal.name}, ${group.category} > ${subcategory.name}, Count: ${animal.count}`,
                    breadcrumb: `${group.category} > ${subcategory.name}`
                });

                links.push({
                    source: subcategoryId,
                    target: animal.name,
                    color: categoryColors.species
                });
            });
        });
    });

    applyStructuredLayout(nodes, links);

    if (wrapper && tooltip) {
        wrapper.addEventListener("mousemove", event => {
            lastMouseX = event.clientX;
            lastMouseY = event.clientY;

            if (hoveredNode && useHoverTooltip()) {
                positionGraphTooltip(tooltip, wrapper, lastMouseX, lastMouseY);
            }
        });

        wrapper.addEventListener("mouseleave", () => {
            if (selectedNode) return;

            hoveredNode = null;

            if (useHoverTooltip()) {
                hideGraphTooltip(tooltip);
            }

            if (window.innerWidth >= 1024) {
                updateInfoPanel(null);
            }
        });
    }

    const graph = ForceGraph3D()(container)
        .enableNodeDrag(false)
        .numDimensions(3)
        .width(container.clientWidth)
        .height(container.clientHeight)
        .graphData({ nodes, links })
        .nodeVisibility(node => isInteractiveSpeciesNode(node))
        .linkVisibility(() => false)
        .nodeLabel(() => "")
        .nodeColor(node => node.color)
        .nodeVal(node =>
            isInteractiveSpeciesNode(node)
                ? node.val * getResponsiveNodeScale(container)
                : 0
        )
        .nodeResolution(18)
        .nodeOpacity(1)
        .linkOpacity(0.45)
        .linkColor(link => link.color)
        .linkWidth(() => 0)
        .backgroundColor(colors.background)
        .cooldownTicks(0)
        .onNodeHover(node => {
            const interactiveNode = isInteractiveSpeciesNode(node) ? node : null;

            container.style.cursor = interactiveNode ? "pointer" : "default";

            hoveredNode = interactiveNode;

            if (window.innerWidth >= 1024) {
                updateInfoPanel(interactiveNode || selectedNode || null);
            }

            if (!tooltip || !useHoverTooltip()) return;

            if (interactiveNode) {
                showGraphTooltip(tooltip, interactiveNode);

                requestAnimationFrame(() => {
                    positionGraphTooltip(tooltip, wrapper, lastMouseX, lastMouseY);
                });
            } else if (!selectedNode) {
                hideGraphTooltip(tooltip);
            }
        })
        .onNodeClick(node => {
            const interactiveNode = isInteractiveSpeciesNode(node) ? node : null;

            if (!interactiveNode) return;

            if (selectedNode && selectedNode.id === interactiveNode.id) {
                selectedNode = null;

                if (window.innerWidth >= 1024) {
                    updateInfoPanel(hoveredNode || null);
                }

                if (!tooltip) return;

                if (useTapTooltip()) {
                    hideGraphTooltip(tooltip);
                } else if (useHoverTooltip() && hoveredNode) {
                    showGraphTooltip(tooltip, hoveredNode);

                    requestAnimationFrame(() => {
                        positionGraphTooltip(tooltip, wrapper, lastMouseX, lastMouseY);
                    });
                } else {
                    hideGraphTooltip(tooltip);
                }

                return;
            }

            selectedNode = interactiveNode;
            hoveredNode = interactiveNode;

            if (window.innerWidth >= 1024) {
                updateInfoPanel(interactiveNode);
            }

            if (!tooltip) return;

            showGraphTooltip(tooltip, interactiveNode);

            requestAnimationFrame(() => {
                if (useTapTooltip()) {
                    positionTapTooltip(tooltip, wrapper);
                } else if (useHoverTooltip()) {
                    positionGraphTooltip(tooltip, wrapper, lastMouseX, lastMouseY);
                }
            });
        })
        .onBackgroundClick(() => {
            selectedNode = null;

            if (window.innerWidth >= 1024) {
                updateInfoPanel(null);
            }

            if (!tooltip) return;
            hideGraphTooltip(tooltip);
        })
        .showNavInfo(false);

    requestAnimationFrame(() => {
        graph.nodeVal(node =>
            isInteractiveSpeciesNode(node)
                ? node.val * getResponsiveNodeScale(container)
                : 0
        );
        graph.linkWidth(() => 0);

        frameGraph(graph, nodes, container);

        const controls = graph.controls();
        controls.enableZoom = false;
        controls.noZoom = true;
        controls.enablePan = false;
        controls.noPan = true;

        container.style.opacity = "1";
    });

    window.addEventListener("resize", () => {
        graph.width(container.clientWidth);
        graph.height(container.clientHeight);

        setTimeout(() => {
            graph.nodeVal(node =>
                isInteractiveSpeciesNode(node)
                    ? node.val * getResponsiveNodeScale(container)
                    : 0
            );
            graph.linkWidth(() => 0);
            frameGraph(graph, nodes, container);

            hoveredNode = null;
            selectedNode = null;
            if (tooltip) hideGraphTooltip(tooltip);
            if (window.innerWidth >= 1024) {
                updateInfoPanel(null);
            }
        }, 150);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const graphContainer = document.getElementById("graph-container");
    if (!graphContainer) return;

    fetch("data-extended.json")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            initGraph(data);
        })
        .catch(error => {
            console.error("Error loading graph data:", error);
            graphContainer.innerHTML = `
        <div class="flex h-full items-center justify-center p-8 text-center text-stone-600">
          Unable to load the wildlife visualization data.
        </div>
      `;
        });
});