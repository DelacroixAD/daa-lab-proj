#include "validate.h"

ValidationResult validateColoring(const std::vector<std::set<int>>& adjList, 
                                 const std::vector<int>& slots) {
    ValidationResult res;
    res.isValid = true;
    int n = static_cast<int>(adjList.size());

    for (int u = 0; u < n; ++u) {
        for (int v : adjList[u]) {
            // Check each undirected edge once where u < v
            if (u < v) {
                if (slots[u] == 0 || slots[v] == 0 || slots[u] == slots[v]) {
                    res.isValid = false;
                    res.conflicts.emplace_back(u, v);
                }
            }
        }
    }

    return res;
}

