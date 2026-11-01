#ifndef VALIDATE_H
#define VALIDATE_H

#include <vector>
#include <set>
#include <utility>

struct ValidationResult {
    bool isValid;
    std::vector<std::pair<int, int>> conflicts; // List of (u, v) pairs where slot[u] == slot[v]
};

// Validates that for every edge (u, v), slot[u] != slot[v].
ValidationResult validateColoring(const std::vector<std::set<int>>& adjList, 
                                 const std::vector<int>& slots);

#endif // VALIDATE_H

