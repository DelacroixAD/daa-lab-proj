#include "coloring.h"
#include <algorithm>
#include <vector>
#include <set>

// Internal helper struct to sort vertices by degree descending, tie-break by lower ID
struct VertexDegree {
    int id;
    int degree;
};

ColoringResult welchPowellColoring(const std::vector<std::set<int>>& adjList) {
    ColoringResult result;
    int n = static_cast<int>(adjList.size());
    if (n == 0) {
        result.totalSlotsUsed = 0;
        return result;
    }

    result.slots.assign(n, 0); // 0 indicates uncolored

    // Build list of vertices with their degrees
    std::vector<VertexDegree> order(n);
    for (int i = 0; i < n; ++i) {
        order[i].id = i;
        order[i].degree = static_cast<int>(adjList[i].size());
    }

    // Step 3: Sort exams by degree descending.
    // Break ties by LOWER ID first using std::stable_sort.
    std::stable_sort(order.begin(), order.end(), [](const VertexDegree& a, const VertexDegree& b) {
        if (a.degree != b.degree) {
            return a.degree > b.degree; // Higher degree comes first
        }
        return a.id < b.id; // Lower ID breaks tie
    });

    int maxSlotUsed = 0;

    // Step 4: For each exam in that order, give it the smallest slot number
    // not used by its already-colored neighbors.
    for (const auto& vd : order) {
        int u = vd.id;
        result.processingOrder.push_back(u);

        // Collect slots used by already-colored neighbors
        std::set<int> usedNeighborSlots;
        for (int neighbor : adjList[u]) {
            int s = result.slots[neighbor];
            if (s > 0) {
                usedNeighborSlots.insert(s);
            }
        }

        // Find smallest positive integer (1-based: 1, 2, 3...) not in usedNeighborSlots
        int chosenSlot = 1;
        while (usedNeighborSlots.find(chosenSlot) != usedNeighborSlots.end()) {
            chosenSlot++;
        }

        result.slots[u] = chosenSlot;
        maxSlotUsed = std::max(maxSlotUsed, chosenSlot);

        // Record trace step
        ColorStep step;
        step.vertexId = u;
        step.degree = vd.degree;
        step.neighborSlots.assign(usedNeighborSlots.begin(), usedNeighborSlots.end());
        step.assignedSlot = chosenSlot;
        result.steps.push_back(step);
    }

    result.totalSlotsUsed = maxSlotUsed;
    return result;
}

