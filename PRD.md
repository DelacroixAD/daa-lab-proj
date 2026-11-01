# Product Requirements Document (PRD)
## Project: Exam Timetable Scheduling using Graph Coloring (C++ Core + JavaScript Website)

---

### 1. Problem Statement
Universities must schedule exams so that no student has two exams at the same time. If two exams share at least one common student, they **conflict** and cannot be placed in the same time slot. The goal is to assign the **minimum number of time slots** to all exams while respecting this constraint.

---

### 2. Core Idea
- Each **exam** is a **vertex** in a graph.
- An **edge** connects two exams if they share at least one student.
- Assigning time slots is equivalent to **coloring the graph** so that no two adjacent vertices have the same color.
- A **greedy coloring algorithm (Welch–Powell)** is used to keep the number of colors (slots) low.

**Reduction:** Exam Scheduling Problem → Graph Coloring Problem

---

### 3. Product Form
The project has **two parts that implement the same algorithm**:

| Part | Language | Purpose |
|---|---|---|
| **A. Console program** (main DAA submission) | C++17 | Reads `input.txt`, builds the graph, colors it, validates, and prints the schedule |
| **B. Demo website** (pure frontend) | HTML + CSS + JavaScript | The same algorithm ported to JS, with an interactive colored graph, sample data, and a step-by-step view |

The C++ program is the primary deliverable for the DAA evaluation. The website is the visual demo. Both use the **same input format**, the **same algorithm**, and the **same tie-breaking rule**, so they give identical results on the same data.

---

### 4. Objectives
- Detect conflicts between exams automatically from student enrollment data.
- Assign slots using a greedy algorithm written from scratch (no coloring library) in both C++ and JavaScript.
- Guarantee that no two conflicting exams share a slot.
- Visualize the conflict graph with nodes colored by slot.
- Show that the C++ and JS versions produce the same output, which confirms the port is correct.

---

### 5. Users
- **Primary:** the student presenting the project (demo and viva).
- **Secondary:** an examiner or reviewer who runs the C++ program or opens the website with their own data.

---

### 6. Functional Requirements

#### Part A: C++ Console Program

| ID | Feature | Description |
|---|---|---|
| A1 | Input from file | Reads `input.txt`, one student per line, e.g. `S1: Math, Physics` |
| A2 | Input parsing | Trims spaces, ignores blank lines, ignores duplicate exams per student, and maps exam names to integer IDs in order of first appearance |
| A3 | Conflict graph builder | Builds an adjacency list (an edge for every pair of exams a student takes) |
| A4 | Greedy coloring engine | Sorts exams by degree (descending, ties broken by lower ID) and assigns the smallest valid slot |
| A5 | Result table | Prints Exam → Slot and the total slots used |
| A6 | Validation | Checks every edge and prints "No conflicts found" or lists the violating pairs |
| A7 | Statistics | Prints number of exams, edges, max degree (Δ), slots used, and the Δ + 1 upper bound |
| A8 | Trace mode | With `--trace`, prints each exam's degree, neighbor slots, and the slot chosen |

#### Part B: JavaScript Website

| ID | Feature | Description |
|---|---|---|
| B1 | Data input | Text area for `S1: Math, Physics` lines, plus CSV upload (`student,exam`) |
| B2 | Sample data | Buttons to load the small sample (Math, Physics, Chemistry, Biology) and a larger one (15 exams, 40 students) |
| B3 | Graph builder + coloring | Same algorithm as the C++ version, in `coloring.js` |
| B4 | Result table | Exam → Slot table and total slots used |
| B5 | Graph visualization | Interactive graph (draggable nodes) colored by slot, with a legend |
| B6 | Validation | Shows "No conflicts found" or the violating pairs |
| B7 | Stats panel | Number of exams, edges, Δ, slots used, and Δ + 1 |
| B8 | Step-by-step view | Table showing the order of processing, neighbor slots, and the slot chosen |

---

### 7. Non-Functional Requirements
- **C++:** compiles with one `g++` command, uses only the standard library, and runs instantly on 20 exams and 50 students.
- **Website:** no backend, no build step, and no installs. It runs from `index.html` or from GitHub Pages.
- Coloring logic is isolated in `coloring.cpp` and `coloring.js`, with no I/O or UI code inside them.
- The two implementations match line by line in structure, so explaining one explains the other.
- All data stays on the user's machine.
- Code is commented and uses clear names for the viva.

---

### 8. Input and Output Formats

**Input (`input.txt` or the website text area):**
```
S1: Math, Physics
S2: Math, Chemistry
S3: Physics, Biology
```

**Derived conflicts:**
```
Math - Physics
Math - Chemistry
Physics - Biology
```

**Output (console and website table):**
```
Math      -> Slot 1
Physics   -> Slot 2
Chemistry -> Slot 2
Biology   -> Slot 1

Slots used: 2
Validation: No conflicts found
```

---

### 9. Algorithm (Welch–Powell Greedy Coloring)
1. Read the input into a map of `student -> list of exams`, and assign each unique exam an integer ID in order of first appearance.
2. For every student, add an edge between every pair of that student's exams. Use a set per vertex to avoid duplicate edges.
3. Compute each exam's degree and sort exams by degree, descending. **Break ties by lower ID** (use `stable_sort` in C++ and the default stable `sort` in JS).
4. For each exam in that order, collect the slots used by its already-colored neighbors, then assign the smallest slot number not in that set.
5. The number of distinct slots used is the schedule length.
6. Validate by checking every edge `(u, v)` has `slot[u] != slot[v]`.

**Complexity**
- Graph building: O(S · k²), where S is the number of students and k is the max exams per student
- Sorting: O(V log V)
- Coloring: O(V + E) neighbor checks
- Upper bound on slots: Δ + 1

---

### 10. Program Flow

```
Part A (C++)       input.txt -> parse -> build graph -> greedy color -> validate -> console table

Part B (Website)   text/CSV -> parse -> build graph -> greedy color -> validate -> table + colored graph
```

Same input into both parts should give the same slots. That is the cross-check.

---

### 11. Edge Cases and Error Handling
- Missing or unreadable input file (C++): print an error and exit with a non-zero code.
- Empty input (both): print a message and do nothing else.
- An exam with no conflicts: appears as an isolated vertex in Slot 1.
- A student with only one exam: valid, adds no edges.
- Duplicate exams for one student: ignored.
- Malformed lines (no colon, no exams): skipped with a warning that includes the line number.
- Exam names with extra spaces or different letter case: trimmed and compared case-insensitively.

---

### 12. Success Criteria
- No student is ever scheduled for two exams in the same slot (validation always passes in both parts).
- Slots used are close to the minimum and never exceed Δ + 1.
- The sample output matches Section 8.
- C++ and JS give the **same slot for every exam** on the same input file.
- The student can explain the algorithm from `coloring.cpp` and demo it live on the website.

---

### 13. Scope and Limitations
- Demonstrates the greedy coloring concept and is not a production scheduler.
- Greedy does not always give the true chromatic number, since graph coloring is NP-Hard. This trade-off is a discussion point for the report.
- The website does not call the C++ program. It runs its own JS port of the algorithm.
- Does not handle room capacity, exam duration, or invigilator availability.

---

### 14. Future Scope
- Add a backtracking exact-coloring mode and compare it with greedy (optimality vs. speed).
- Add DSATUR as a second heuristic.
- Compile the C++ to WebAssembly so the website runs the real C++ code.
- Map slots to real dates and times and export the timetable as CSV.
- Add room allocation.

---

### 15. Milestones

| Phase | Deliverable |
|---|---|
| 1 | C++: `coloring.cpp` working on a hard-coded sample graph |
| 2 | C++: file parsing, graph builder, validation, console output, `--trace` |
| 3 | C++: edge cases and larger test files (`input_large.txt`) |
| 4 | Website: port the logic to `coloring.js`, then input panel, result table, validation |
| 5 | Website: graph visualization, stats, step-by-step view, styling |
| 6 | Cross-check C++ vs JS on all test files, deploy to GitHub Pages, and write viva notes |
