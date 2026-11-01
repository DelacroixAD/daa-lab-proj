#include "graph.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <algorithm>
#include <cctype>

// Trim whitespace from both ends of a string
static std::string trim(const std::string& s) {
    size_t start = s.find_first_not_of(" \t\r\n");
    if (start == std::string::npos) return "";
    size_t end = s.find_last_not_of(" \t\r\n");
    return s.substr(start, end - start + 1);
}

// Convert string to lowercase for case-insensitive comparisons
static std::string toLower(const std::string& s) {
    std::string res = s;
    std::transform(res.begin(), res.end(), res.begin(), [](unsigned char c) {
        return static_cast<char>(std::tolower(c));
    });
    return res;
}

int ExamGraph::getOrInsertExam(const std::string& rawName) {
    std::string trimmed = trim(rawName);
    std::string key = toLower(trimmed);

    auto it = nameToId.find(key);
    if (it != nameToId.end()) {
        return it->second;
    }

    // Step 1: Assign integer ID in order of first appearance
    int newId = static_cast<int>(nodes.size());
    nameToId[key] = newId;
    nodes.push_back({newId, trimmed});
    adjList.emplace_back(); // Empty set of neighbors for the new vertex
    return newId;
}

void ExamGraph::addEdge(int u, int v) {
    if (u == v) return; // No self-loops
    adjList[u].insert(v);
    adjList[v].insert(u);
}

bool ExamGraph::parseLine(const std::string& line, int lineNumber) {
    std::string trimmedLine = trim(line);
    if (trimmedLine.empty()) {
        return true; // Ignore blank lines
    }

    size_t colonPos = trimmedLine.find(':');
    if (colonPos == std::string::npos) {
        parseWarnings.push_back("Line " + std::to_string(lineNumber) + 
            ": Malformed line (missing colon): \"" + trimmedLine + "\"");
        return false;
    }

    std::string studentId = trim(trimmedLine.substr(0, colonPos));
    std::string examsPart = trim(trimmedLine.substr(colonPos + 1));

    if (studentId.empty() || examsPart.empty()) {
        parseWarnings.push_back("Line " + std::to_string(lineNumber) + 
            ": Malformed line (empty student ID or empty exam list): \"" + trimmedLine + "\"");
        return false;
    }

    // Parse comma-separated exams
    std::stringstream ss(examsPart);
    std::string item;
    std::vector<int> studentExamIds;
    std::set<int> seenInStudent; // Ignore duplicate exams per student

    while (std::getline(ss, item, ',')) {
        std::string examName = trim(item);
        if (!examName.empty()) {
            int id = getOrInsertExam(examName);
            if (seenInStudent.insert(id).second) {
                studentExamIds.push_back(id);
            }
        }
    }

    if (studentExamIds.empty()) {
        parseWarnings.push_back("Line " + std::to_string(lineNumber) + 
            ": No valid exams found on line: \"" + trimmedLine + "\"");
        return false;
    }

    // Record student enrollments for individual timetable display
    studentRecords.push_back({studentId, studentExamIds});

    // Step 2: Add an undirected conflict edge between every pair of that student's exams
    for (size_t i = 0; i < studentExamIds.size(); ++i) {
        for (size_t j = i + 1; j < studentExamIds.size(); ++j) {
            addEdge(studentExamIds[i], studentExamIds[j]);
        }
    }

    return true;
}

bool ExamGraph::loadFromFile(const std::string& filename) {
    std::ifstream file(filename);
    if (!file.is_open()) {
        return false;
    }

    std::string line;
    int lineNum = 0;
    while (std::getline(file, line)) {
        lineNum++;
        parseLine(line, lineNum);
    }

    return true;
}

int ExamGraph::numEdges() const {
    int total = 0;
    for (const auto& neighbors : adjList) {
        total += static_cast<int>(neighbors.size());
    }
    return total / 2; // Each undirected edge counted twice
}

int ExamGraph::maxDegree() const {
    int maxDeg = 0;
    for (const auto& neighbors : adjList) {
        maxDeg = std::max(maxDeg, static_cast<int>(neighbors.size()));
    }
    return maxDeg;
}

