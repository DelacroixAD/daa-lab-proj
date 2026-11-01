# Exam Timetable Scheduler (Welch-Powell Graph Coloring)

A complete project implementing automated conflict-free exam timetable scheduling using the **Welch-Powell greedy graph coloring algorithm**. The repository contains two implementations of the identical algorithm:
1. A **C++17 console application** (standard library only).
2. A **pure frontend web application** (HTML, CSS, vanilla JavaScript, vis-network CDN for layout).

---

## Algorithm & Mathematical Foundations

### 1. Problem Formulation
- **Vertices ($V$)**: Each distinct examination course is a vertex.
- **Edges ($E$)**: An undirected edge exists between exam $u$ and exam $v$ if at least one enrolled student takes both exams.
- **Colors**: Discrete time slots (Slot 1, Slot 2, ...).
- **Objective**: Color $G = (V, E)$ such that $\forall (u, v) \in E, \text{slot}[u] \neq \text{slot}[v]$, minimizing the chromatic number $\chi(G)$.

### 2. Welch-Powell Heuristic Steps
1. **Assign Sequential IDs**: Parse student lines, assigning 0-based integer IDs to exams in order of first appearance.
2. **Build Conflict Edges**: For each student taking $k$ exams, insert an edge between all $\binom{k}{2}$ exam pairs into a `std::set` (avoiding duplicates and self-loops).
3. **Sort Vertices by Degree**: Sort exams by degree $\deg(v)$ in descending order. Break ties strictly by **LOWER ID** first (`std::stable_sort` in C++, native stable sort in JavaScript).
4. **Greedy Coloring**: Iterate over vertices in the sorted order. For each vertex $u$, inspect the slots assigned to all already-colored neighbors of $u$, and assign $u$ the minimum positive integer slot $s \in \{1, 2, 3, \dots\}$ not in use by those neighbors.
5. **Validation**: Assert $\text{slot}[u] \neq \text{slot}[v]$ for every edge $(u, v) \in E$.

### 3. Complexity Analysis
- **Graph Construction**: $\mathcal{O}\left(\sum S_i \cdot k_i^2 \log V\right)$ where $S$ is the number of students and $k$ is the number of exams per student (log factor due to set insertion).
- **Sorting**: $\mathcal{O}(V \log V)$ using stable comparison sort.
- **Greedy Coloring**: $\mathcal{O}(V + E)$ since each vertex and each edge is inspected a constant number of times.
- **Upper Bound**: The greedy algorithm guarantees that at most $\Delta(G) + 1$ slots are used, where $\Delta(G)$ is the maximum degree of the conflict graph (Brooks' Theorem).

---

## How to Compile and Run (C++)

Navigate to the `cpp/` directory:
```bash
cd exam-scheduler/cpp
```

### 1. Compilation
```bash
g++ -std=c++17 -Wall -o scheduler main.cpp graph.cpp coloring.cpp validate.cpp
```

### 2. Execution
Run on the small sample:
```bash
./scheduler input.txt
```

Run with step-by-step trace:
```bash
./scheduler input.txt --trace
```

Run on the large dataset (16 exams, 42 students):
```bash
./scheduler input_large.txt
```

---

## How to Run the Website

Navigate to the `web/` directory:
```bash
cd exam-scheduler/web
```

Open `index.html` directly in any modern web browser, or serve it using Python / Node:
```bash
# Using Python
python -m http.server 8000

# Or using Node
npx serve .
```
Then visit `http://localhost:8000` in your browser.

---

## Output Verification

### Sample Input (`input.txt`)
```text
S1: Math, Physics
S2: Math, Chemistry
S3: Physics, Biology
```

#### Order of First Appearance:
- `Math` (ID 0)
- `Physics` (ID 1)
- `Chemistry` (ID 2)
- `Biology` (ID 3)

#### Degree Calculation:
- `Math` $\to$ neighbors: {Physics, Chemistry} $\implies \deg = 2$ (ID 0)
- `Physics` $\to$ neighbors: {Math, Biology} $\implies \deg = 2$ (ID 1)
- `Chemistry` $\to$ neighbors: {Math} $\implies \deg = 1$ (ID 2)
- `Biology` $\to$ neighbors: {Physics} $\implies \deg = 1$ (ID 3)

#### Sorted Processing Order (Descending Degree, lower ID tie-breaker):
1. **Math** (ID 0, degree 2)
2. **Physics** (ID 1, degree 2)
3. **Chemistry** (ID 2, degree 1)
4. **Biology** (ID 3, degree 1)

#### Sequential Slot Assignment:
1. **Math**: Neighbors colored: $\emptyset \implies$ **Slot 1**
2. **Physics**: Neighbor `Math` is Slot 1 $\implies$ **Slot 2**
3. **Chemistry**: Neighbor `Math` is Slot 1 $\implies$ **Slot 2**
4. **Biology**: Neighbor `Physics` is Slot 2 $\implies$ **Slot 1**

#### Result:
- **Math $\to$ Slot 1**
- **Physics $\to$ Slot 2**
- **Chemistry $\to$ Slot 2**
- **Biology $\to$ Slot 1**
- **Total Slots Used**: 2
- **Validation**: No conflicts found ($100\%$ match between C++ and JavaScript).

#### Individual Student Timetables:
- **S1**: Slot 1: Math | Slot 2: Physics
- **S2**: Slot 1: Math | Slot 2: Chemistry
- **S3**: Slot 1: Biology | Slot 2: Physics
*(Each student has exams assigned strictly to distinct time slots, confirming 0 collisions).*

