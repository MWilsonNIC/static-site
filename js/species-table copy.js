let allSpecies = [];
let currentSort = "count";
let currentDirection = "desc";

async function drawSpeciesTable() {
  const container = document.getElementById("species-table");
  if (!container) return;

  try {
    const response = await fetch("data.json");
    const data = await response.json();

    allSpecies = [];

    data.forEach(group => {
      group.patients.forEach(patient => {
        allSpecies.push({
          name: patient.name,
          count: patient.count,
          category: group.category,
          catColor: group.color
        });
      });
    });

    renderSpeciesTable();
  } catch (error) {
    console.error("Error loading species table:", error);
    container.innerHTML = `<p>Unable to load species data.</p>`;
  }
}

function getSortedSpecies(data, sortBy, direction) {
  const sorted = [...data];

  sorted.sort((a, b) => {
    if (sortBy === "species") {
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) {
        return direction === "asc" ? nameCompare : -nameCompare;
      }

      return b.count - a.count;
    }

    if (sortBy === "category") {
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

// function getArrow(sortName) {
//   if (currentSort !== sortName) return "";

//   return currentDirection === "asc"
//     ? ` <span aria-hidden="true">↑</span>`
//     : ` <span aria-hidden="true">↓</span>`;
// }

function getArrow(sortName) {
  const isActive = currentSort === sortName;
  const arrow = currentDirection === "asc" ? "↑" : "↓";

  return `
    <span
      class="inline-block w-4 text-center"
      style="visibility: ${isActive ? "visible" : "hidden"};"
      aria-hidden="true"
    >
      ${arrow}
    </span>
  `;
}

// function renderSpeciesTable() {
//   const container = document.getElementById("species-table");
//   if (!container) return;

//   const sortedSpecies = getSortedSpecies(allSpecies, currentSort, currentDirection);

//   container.innerHTML = `
//     <table class="w-full table-fixed border-collapse text-sm bg-white">
//       <thead>
//         <tr class="border-b border-stone-300">
//           <th class="w-1/2 p-3 text-left bg-stone-200 font-bold">
//             <button
//               type="button"
//               class="cursor-pointer"
//               data-sort="species"
//               aria-label="Sort by species">
//               Species${getArrow("species")}
//             </button>
//           </th>
//           <th class="w-1/4 p-3 text-left bg-stone-200 font-bold">
//             <button
//               type="button"
//               class="cursor-pointer"
//               data-sort="category"
//               aria-label="Sort by category">
//               Category${getArrow("category")}
//             </button>
//           </th>
//           <th class="w-1/4 p-3 text-left bg-stone-200 font-bold">
//             <button
//               type="button"
//               class="cursor-pointer"
//               data-sort="count"
//               aria-label="Sort by count">
//               Count${getArrow("count")}
//             </button>
//           </th>
//         </tr>
//       </thead>
//       <tbody>
//         ${sortedSpecies.map(species => `
//           <tr class="border-b border-stone-300">
//             <td class="p-3 font-medium">${species.name}</td>
//             <td class="p-3">
//               <span style="color: ${species.catColor}; font-weight: 700;">
//                 ${species.category}
//               </span>
//             </td>
//             <td class="p-3">${species.count}</td>
//           </tr>
//         `).join("")}
//       </tbody>
//     </table>
//   `;

//   const sortButtons = container.querySelectorAll("[data-sort]");

//   sortButtons.forEach(button => {
//     button.addEventListener("click", () => {
//       const clickedSort = button.dataset.sort;

//       if (clickedSort === currentSort) {
//         currentDirection = currentDirection === "asc" ? "desc" : "asc";
//       } else {
//         currentSort = clickedSort;
//         currentDirection = clickedSort === "count" ? "desc" : "asc";
//       }

//       renderSpeciesTable();
//     });
//   });
// }

function renderSpeciesTable() {
  const container = document.getElementById("species-table");
  if (!container) return;

  const sortedSpecies = getSortedSpecies(allSpecies, currentSort, currentDirection);

  container.innerHTML = `
    <table class="min-w-full table-fixed border-collapse text-sm bg-white">
      <colgroup>
        <col style="width: 50%;">
        <col style="width: 30%;">
        <col style="width: 20%;">
      </colgroup>
      <thead>
        <tr class="border-b border-stone-300">
          <th class="p-3 text-left bg-stone-200 font-bold">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 text-left"
              data-sort="species"
              aria-label="Sort by species">
              <span>Species</span>
              ${getArrow("species")}
            </button>
          </th>
          <th class="p-3 text-left bg-stone-200 font-bold">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 text-left"
              data-sort="category"
              aria-label="Sort by category">
              <span>Category</span>
              ${getArrow("category")}
            </button>
          </th>
          <th class="p-3 text-left bg-stone-200 font-bold">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 text-left"
              data-sort="count"
              aria-label="Sort by count">
              <span>Count</span>
              ${getArrow("count")}
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        ${sortedSpecies.map(species => `
          <tr class="border-b border-stone-300">
            <td class="p-3 font-medium">${species.name}</td>
            <td class="p-3">
              <span style="color: ${species.catColor}; font-weight: 700;">
                ${species.category}
              </span>
            </td>
            <td class="p-3">${species.count}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  const sortButtons = container.querySelectorAll("[data-sort]");

  sortButtons.forEach(button => {
    button.addEventListener("click", () => {
      const clickedSort = button.dataset.sort;

      if (clickedSort === currentSort) {
        currentDirection = currentDirection === "asc" ? "desc" : "asc";
      } else {
        currentSort = clickedSort;
        currentDirection = clickedSort === "count" ? "desc" : "asc";
      }

      renderSpeciesTable();
    });
  });
}

drawSpeciesTable();
