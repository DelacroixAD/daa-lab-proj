// Validates that for every edge (u, v), slot[u] != slot[v].
function validateColoring(adjList, slots) {
    const conflicts = [];
    const n = adjList.length;

    for (let u = 0; u < n; u++) {
        for (const v of adjList[u]) {
            if (u < v) { // Check each undirected edge once
                if (!slots[u] || !slots[v] || slots[u] === slots[v]) {
                    conflicts.push([u, v]);
                }
            }
        }
    }

    return {
        isValid: conflicts.length === 0,
        conflicts: conflicts
    };
}

// Export for Node.js test environment if present
if (typeof module !== 'undefined' && module.exports) {
    module.exports = validateColoring;
}

