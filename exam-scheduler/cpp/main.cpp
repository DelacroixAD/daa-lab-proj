#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include "graph.h"
#include "coloring.h"
#include "validate.h"

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <input_file> [--trace]\n";
        return 1;
    }

    std::string filename = argv[1];
    bool trace = false;
    for (int i = 2; i < argc; ++i) {
        if (std::string(argv[i]) == "--trace") {
            trace = true;
        }
    }

    ExamGraph graph;
    if (!graph.loadFromFile(filename)) {
        std::cerr << "Error: Could not open or read input file: \"" << filename << "\"\n";
        return 1;
    }

    // Display any malformed line warnings
    if (!graph.parseWarnings.empty()) {
        std::cout << "--- Parsing Warnings ---\n";
        for (const auto& w : graph.parseWarnings) {
            std::cout << "[WARNING] " << w << "\n";
        }
        std::cout << "\n";
    }

    if (graph.numVertices() == 0) {
        std::cout << "Input file is empty or contains no valid exam records.\n";
        return 0;
    }

    // Run Welch-Powell coloring
    ColoringResult result = welchPowellColoring(graph.adjList);

    // Validate the schedule
    ValidationResult validation = validateColoring(graph.adjList, result.slots);

    // Print Schedule Table
    std::cout << "========================================\n";
    std::cout << "        EXAM TIMETABLE SCHEDULE        \n";
    std::cout << "========================================\n";
    std::cout << std::left << std::setw(6)  << "ID"
              << std::setw(26) << "Exam Name"
              << std::setw(12) << "Time Slot" << "\n";
    std::cout << "----------------------------------------\n";
    for (const auto& node : graph.nodes) {
        std::string slotStr = "Slot " + std::to_string(result.slots[node.id]);
        std::cout << std::left << std::setw(6)  << node.id
                  << std::setw(26) << node.name
                  << std::setw(12) << slotStr << "\n";
    }
    std::cout << "----------------------------------------\n";
    std::cout << "Total Slots Required: " << result.totalSlotsUsed << "\n\n";

    // Print Individual Student Timetables
    std::cout << "========================================\n";
    std::cout << "           STUDENT TIMETABLES           \n";
    std::cout << "========================================\n";
    std::cout << std::left << std::setw(10) << "Student"
              << "Chronological Exam Slots\n";
    std::cout << "----------------------------------------\n";
    for (const auto& rec : graph.studentRecords) {
        // Collect and sort student's exams chronologically by slot
        std::vector<std::pair<int, std::string>> studentSlots;
        for (int examId : rec.second) {
            studentSlots.push_back({result.slots[examId], graph.nodes[examId].name});
        }
        std::sort(studentSlots.begin(), studentSlots.end());

        std::string scheduleStr = "";
        for (size_t i = 0; i < studentSlots.size(); ++i) {
            scheduleStr += "Slot " + std::to_string(studentSlots[i].first) + ": " + studentSlots[i].second;
            if (i + 1 < studentSlots.size()) scheduleStr += " | ";
        }

        std::cout << std::left << std::setw(10) << rec.first
                  << scheduleStr << "\n";
    }
    std::cout << "----------------------------------------\n\n";

    // Print Graph Statistics
    int vCount = graph.numVertices();
    int eCount = graph.numEdges();
    int maxDeg = graph.maxDegree();
    int upperBound = maxDeg + 1;

    std::cout << "========================================\n";
    std::cout << "            GRAPH STATISTICS            \n";
    std::cout << "========================================\n";
    std::cout << "Number of Exams (Vertices): " << vCount << "\n";
    std::cout << "Number of Conflicts (Edges): " << eCount << "\n";
    std::cout << "Maximum Degree (Delta):      " << maxDeg << "\n";
    std::cout << "Upper Bound (Delta + 1):     " << upperBound << " slots\n";
    std::cout << "Slots Used by Welch-Powell:  " << result.totalSlotsUsed << " slots\n\n";

    // Print Validation Result
    std::cout << "========================================\n";
    std::cout << "               VALIDATION               \n";
    std::cout << "========================================\n";
    if (validation.isValid) {
        std::cout << "Validation: No conflicts found (All adjacent exams have distinct slots).\n\n";
    } else {
        std::cout << "Validation: FAILED! Found " << validation.conflicts.size() << " conflicting pair(s):\n";
        for (const auto& edge : validation.conflicts) {
            std::cout << " - Conflict between: \"" << graph.nodes[edge.first].name 
                      << "\" (Slot " << result.slots[edge.first] << ") and \""
                      << graph.nodes[edge.second].name 
                      << "\" (Slot " << result.slots[edge.second] << ")\n";
        }
        std::cout << "\n";
    }

    // Optional trace output
    if (trace) {
        std::cout << "========================================\n";
        std::cout << "       WELCH-POWELL ALGORITHM TRACE     \n";
        std::cout << "========================================\n";
        std::cout << std::left << std::setw(6)  << "Step"
                  << std::setw(26) << "Exam Name"
                  << std::setw(8)  << "Degree"
                  << std::setw(24) << "Neighbor Slots Used"
                  << std::setw(12) << "Assigned" << "\n";
        std::cout << "----------------------------------------------------------------------------\n";

        for (size_t i = 0; i < result.steps.size(); ++i) {
            const auto& step = result.steps[i];
            std::string nSlots = "{";
            for (size_t s = 0; s < step.neighborSlots.size(); ++s) {
                nSlots += std::to_string(step.neighborSlots[s]);
                if (s + 1 < step.neighborSlots.size()) nSlots += ", ";
            }
            nSlots += "}";

            std::cout << std::left << std::setw(6)  << (i + 1)
                      << std::setw(26) << graph.nodes[step.vertexId].name
                      << std::setw(8)  << step.degree
                      << std::setw(24) << nSlots
                      << "Slot " << step.assignedSlot << "\n";
        }
        std::cout << "----------------------------------------------------------------------------\n";
    }

    return 0;
}

