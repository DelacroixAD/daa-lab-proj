// Builds graph representation from student course enrollments
const GraphBuilder = {
    buildGraph: function(studentMap) {
        const nodes = [];                  // Array of { id: number, name: string }
        const nameToId = new Map();        // lowercase exam name -> ID
        const adjList = [];                // Array of Set of neighbor IDs

        function getOrInsertExam(rawName) {
            const trimmed = rawName.trim();
            const key = trimmed.toLowerCase();

            if (nameToId.has(key)) {
                return nameToId.get(key);
            }

            // Step 1: Assign integer ID in order of first appearance
            const newId = nodes.length;
            nameToId.set(key, newId);
            nodes.push({ id: newId, name: trimmed });
            adjList.push(new Set());
            return newId;
        }

        function addEdge(u, v) {
            if (u === v) return;
            adjList[u].add(v);
            adjList[v].add(u);
        }

        // Step 2: Add edge between every pair of that student's exams
        for (const [studentId, examSet] of studentMap.entries()) {
            const examIds = [];
            for (const examName of examSet) {
                examIds.push(getOrInsertExam(examName));
            }

            for (let i = 0; i < examIds.length; i++) {
                for (let j = i + 1; j < examIds.length; j++) {
                    addEdge(examIds[i], examIds[j]);
                }
            }
        }

        return { nodes, adjList, nameToId };
    },

    computeStats: function(nodes, adjList) {
        const numVertices = nodes.length;
        let totalNeighborDegrees = 0;
        let maxDegree = 0;

        for (let i = 0; i < numVertices; i++) {
            const deg = adjList[i].size;
            totalNeighborDegrees += deg;
            if (deg > maxDegree) maxDegree = deg;
        }

        return {
            numVertices,
            numEdges: Math.floor(totalNeighborDegrees / 2),
            maxDegree,
            upperBound: maxDegree + 1
        };
    }
};

// Export for Node.js test environment if present
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphBuilder;
}

