#ifndef GRAPH_H
#define GRAPH_H

#include <string>
#include <vector>
#include <set>
#include <unordered_map>

// Represents an exam vertex in the graph
struct ExamNode {
    int id;                 // Unique 0-based integer assigned in order of first appearance
    std::string name;       // Canonical display name
};

// Represents the exam conflict graph
class ExamGraph {
public:
    std::vector<ExamNode> nodes;                       // Nodes indexed by their 0-based ID
    std::unordered_map<std::string, int> nameToId;     // Case-insensitive lookup (lowercase -> ID)
    std::vector<std::set<int>> adjList;                // Adjacency list using std::set to avoid duplicate edges
    std::vector<std::string> parseWarnings;            // Malformed line warnings with line numbers
    std::vector<std::pair<std::string, std::vector<int>>> studentRecords; // (studentId, [examIds])

    // Helper to get or insert an exam name (returns 0-based ID)
    int getOrInsertExam(const std::string& rawName);

    // Adds an undirected conflict edge between two exams
    void addEdge(int u, int v);

    // Parses a single student line (e.g. "S1: Math, Physics")
    bool parseLine(const std::string& line, int lineNumber);

    // Reads and parses an input file from disk
    bool loadFromFile(const std::string& filename);

    // Graph statistics
    int numVertices() const { return static_cast<int>(nodes.size()); }
    int numEdges() const;
    int maxDegree() const;
    int degree(int u) const { return static_cast<int>(adjList[u].size()); }
};

#endif // GRAPH_H

