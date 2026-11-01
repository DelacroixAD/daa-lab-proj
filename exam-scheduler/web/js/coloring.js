// Pure algorithm implementation: DIRECT PORT of coloring.cpp
// Contains NO DOM, NO console, NO file code.
// Accepts adjacency list (array of Sets) and returns slots + step trace.
function welchPowellColoring(adjList) {
    const n = adjList.length;
    if (n === 0) {
        return {
            slots: [],
            totalSlotsUsed: 0,
            processingOrder: [],
            steps: []
        };
    }

    const slots = new Array(n).fill(0); // 0 indicates uncolored
    const processingOrder = [];
    const steps = [];

    // Build degree list
    const order = [];
    for (let i = 0; i < n; i++) {
        order.push({
            id: i,
            degree: adjList[i].size
        });
    }

    // Step 3: Sort exams by degree, descending. Break ties by LOWER ID first.
    // JavaScript Array.prototype.sort is guaranteed stable since ECMAScript 2019.
    order.sort((a, b) => {
        if (a.degree !== b.degree) {
            return b.degree - a.degree; // Higher degree first
        }
        return a.id - b.id; // Lower ID breaks tie
    });

    let maxSlotUsed = 0;

    // Step 4: For each exam in that order, give it the smallest slot number
    // not used by its already-colored neighbors.
    for (let i = 0; i < order.length; i++) {
        const u = order[i].id;
        const degree = order[i].degree;
        processingOrder.push(u);

        // Collect slots used by already-colored neighbors
        const usedNeighborSlots = new Set();
        for (const neighbor of adjList[u]) {
            const s = slots[neighbor];
            if (s > 0) {
                usedNeighborSlots.add(s);
            }
        }

        // Find smallest positive integer slot (1, 2, 3...)
        let chosenSlot = 1;
        while (usedNeighborSlots.has(chosenSlot)) {
            chosenSlot++;
        }

        slots[u] = chosenSlot;
        if (chosenSlot > maxSlotUsed) {
            maxSlotUsed = chosenSlot;
        }

        // Convert used neighbor slots to sorted array for clean presentation
        const sortedNeighborSlots = Array.from(usedNeighborSlots).sort((a, b) => a - b);

        steps.push({
            vertexId: u,
            degree: degree,
            neighborSlots: sortedNeighborSlots,
            assignedSlot: chosenSlot
        });
    }

    return {
        slots: slots,
        totalSlotsUsed: maxSlotUsed,
        processingOrder: processingOrder,
        steps: steps
    };
}

// Export for Node.js test environment if present
if (typeof module !== 'undefined' && module.exports) {
    module.exports = welchPowellColoring;
}

