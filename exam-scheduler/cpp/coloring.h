#ifndef COLORING_H
#define COLORING_H

#include <vector>
#include <set>

// Contains trace/explanation for a single vertex assignment (for viva/trace)
struct ColorStep {
    int vertexId;
    int degree;
    std::vector<int> neighborSlots; // Sorted distinct 1-based slots used by neighbors
    int assignedSlot;               // 1-based slot assigned to this vertex
};

// Result of graph coloring
struct ColoringResult {
    std::vector<int> slots;         // 1-based slot for each vertex (indexed by vertex ID)
    int totalSlotsUsed;             // Maximum slot number used
    std::vector<int> processingOrder; // Order of vertex IDs processed
    std::vector<ColorStep> steps;   // Trace steps
};

// Pure algorithmic function: NO I/O, NO file, NO console code.
// Accepts adjacency list (std::vector of std::set<int>) and returns slots + steps.
ColoringResult welchPowellColoring(const std::vector<std::set<int>>& adjList);

#endif // COLORING_H

