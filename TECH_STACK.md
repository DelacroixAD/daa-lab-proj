# Tech Stack
## Exam Timetable Scheduling using Graph Coloring (C++ Core + JavaScript Website)

---

## 1. Summary

| Part | Layer | Choice | Why |
|---|---|---|---|
| **A. Console** | Language | C++17 | Standard for DAA projects, with the algorithm fully visible |
| | Data structures | STL: `vector`, `set`, `map`/`unordered_map` | Adjacency list, name-to-ID mapping, neighbor checks |
| | Compiler | g++ (MinGW on Windows, GCC on Linux, Clang on macOS) | Free and standard |
| | Input / Output | `input.txt` in, console out | Simple to demo |
| **B. Website** | Markup / Style | HTML5 + CSS3 | Single page, no framework |
| | Logic | Vanilla JavaScript (ES6+) | A direct port of the C++ algorithm |
| | Graph drawing | [vis-network](https://visjs.github.io/vis-network/) via CDN | Interactive and draggable, with per-node colors |
| | Hosting | GitHub Pages | Free static hosting |
| **Common** | Version control | Git + GitHub | Needed for deployment |
| | Editor | VS Code (+ Live Server extension for the website) | Works for both parts |

**No external C++ libraries, no JS frameworks, no backend, and no build tools.**

---

## 2. Rules for Keeping It Viva-Safe

1. Write the coloring logic yourself in both languages. Don't use any graph or coloring library.
2. `coloring.cpp` and `coloring.js` contain **no file, console or DOM code**. They take an adjacency list and return slots.
3. vis-network is used **only to draw**. It never decides colors or slots.
4. Keep both versions structured identically, so you can say "this JS function is the same as that C++ function."
5. Use the **same tie-breaking rule** in both (lower ID first when degrees are equal), or the outputs may differ.

---

## 3. Project Structure

```
exam-scheduler/
├── cpp/                      # Part A: C++ console program (main DAA submission)
│   ├── main.cpp              # reads args, calls each stage, prints results
│   ├── graph.h / graph.cpp   # parses input, builds the adjacency list
│   ├── coloring.h / coloring.cpp   # Welch-Powell greedy coloring (core logic)
│   ├── validate.h / validate.cpp   # checks no edge has the same slot on both ends
│   ├── input.txt             # small sample
│   └── input_large.txt       # 15+ exams, 40+ students
│
├── web/                      # Part B: pure frontend website
│   ├── index.html            # page layout
│   ├── css/style.css
│   └── js/
│       ├── data.js           # sample datasets
│       ├── parser.js         # text/CSV -> { student: [exams] }
│       ├── graph.js          # builds the adjacency list
│       ├── coloring.js       # Welch-Powell greedy coloring (JS port)
│       ├── validate.js       # checks all edges
│       ├── visualize.js      # vis-network drawing
│       └── main.js           # connects the UI to the modules above
│
└── README.md
```

---

## 4. Module Mapping (C++ <-> JavaScript)

| Job | C++ file | JS file | Input | Output |
|---|---|---|---|---|
| Parse input | `graph.cpp` | `parser.js` | Text | Student-to-exams map |
| Build graph | `graph.cpp` | `graph.js` | Student-to-exams map | Adjacency list |
| Color | `coloring.cpp` | `coloring.js` | Adjacency list | Slot for each exam (+ step log) |
| Validate | `validate.cpp` | `validate.js` | Adjacency list + slots | Valid flag + violating pairs |
| Display | `main.cpp` | `main.js` + `visualize.js` | Results | Console table / table + graph |

---

## 5. Core Algorithm: C++ (`coloring.cpp`)

```cpp
#include <vector>
#include <set>
#include <algorithm>
#include <numeric>
using namespace std;

// adj[v] = set of exams that conflict with exam v
// returns slot[v] (1-based) for every exam v
vector<int> greedyColor(const vector<set<int>>& adj) {
    int n = adj.size();

    // 1. Order vertices by degree, descending (Welch-Powell).
    //    stable_sort keeps lower IDs first when degrees are equal.
    vector<int> order(n);
    iota(order.begin(), order.end(), 0);
    stable_sort(order.begin(), order.end(), [&](int a, int b) {
        return adj[a].size() > adj[b].size();
    });

    vector<int> slot(n, 0);   // 0 = not colored yet

    // 2. Give each vertex the smallest slot unused by its colored neighbors
    for (int v : order) {
        set<int> used;
        for (int nb : adj[v])
            if (slot[nb] != 0) used.insert(slot[nb]);

        int s = 1;
        while (used.count(s)) s++;
        slot[v] = s;
    }
    return slot;
}
```

## 6. Core Algorithm: JavaScript (`coloring.js`)

```js
// adj[v] = Set of exam IDs that conflict with exam v
// returns { slot, steps }, where slot[v] is 1-based
function greedyColor(adj) {
  const n = adj.length;

  // 1. Order by degree, descending. JS sort is stable, so ties keep lower IDs first.
  const order = Array.from({ length: n }, (_, i) => i);
  order.sort((a, b) => adj[b].size - adj[a].size);

  const slot = new Array(n).fill(0);   // 0 = not colored yet
  const steps = [];

  // 2. Give each vertex the smallest slot unused by its colored neighbors
  for (const v of order) {
    const used = new Set();
    for (const nb of adj[v]) if (slot[nb] !== 0) used.add(slot[nb]);

    let s = 1;
    while (used.has(s)) s++;
    slot[v] = s;
    steps.push({ exam: v, degree: adj[v].size, usedByNeighbors: [...used], chosen: s });
  }
  return { slot, steps };
}
```

The `steps` array feeds the step-by-step panel on the website.

---

## 7. Validation (both languages)

**C++**
```cpp
bool validate(const vector<set<int>>& adj, const vector<int>& slot,
              vector<pair<int,int>>& violations) {
    for (int u = 0; u < (int)adj.size(); u++)
        for (int v : adj[u])
            if (u < v && slot[u] == slot[v])
                violations.push_back({u, v});
    return violations.empty();
}
```

**JavaScript**
```js
function validate(adj, slot) {
  const violations = [];
  for (let u = 0; u < adj.length; u++)
    for (const v of adj[u])
      if (u < v && slot[u] === slot[v]) violations.push([u, v]);
  return { valid: violations.length === 0, violations };
}
```

---

## 8. Building the Graph (idea, both languages)

```
for each student with exam IDs e[0..k-1]:
    for i in 0..k-1:
        for j in i+1..k-1:
            adj[e[i]].insert(e[j])
            adj[e[j]].insert(e[i])
```

Use a map from exam name to ID (assign IDs in order of first appearance) and an array that turns IDs back into names. Both versions must assign IDs the same way for the outputs to match.

---

## 9. Build and Run

**Part A: C++**
```bash
cd cpp
g++ -std=c++17 -Wall -o scheduler main.cpp graph.cpp coloring.cpp validate.cpp

./scheduler input.txt            # normal run
./scheduler input.txt --trace    # also show the step-by-step trace
```
On Windows (MinGW): `scheduler.exe input.txt`.
With an IDE (Code::Blocks, Dev-C++, VS Code), add all `.cpp` files to one project and press Build and Run. Keep `input.txt` in the same folder as the executable.

**Part B: Website**
- Open `web/index.html` in a browser, or right-click it in VS Code and choose "Open with Live Server".
- For online hosting, push to GitHub, then **Settings -> Pages**, select the `main` branch, and save.

---

## 10. Website Visualization Details (vis-network)

- Load the CDN script `https://unpkg.com/vis-network/standalone/umd/vis-network.min.js` (pin a version when you add it).
- Nodes: `{ id, label, color }`, where color comes from a fixed palette indexed by slot.
- Edges: `{ from, to }` from the adjacency list (add each pair once).
- Options: enable physics for automatic layout and allow dragging.
- Add a legend that lists each slot with its color.
- **Zero-dependency fallback:** draw nodes on a circle with SVG (`<circle>` and `<line>`).

Suggested palette (10+ slots):
`#e6194b #3cb44b #4363d8 #f58231 #911eb4 #46f0f0 #f032e6 #bcf60c #fabebe #008080`

---

## 11. Testing and Cross-Check

Use the **same input files** in both parts and compare the Exam → Slot results.

1. The PRD sample (expect 2 slots)
2. A file where no exams share students (expect 1 slot)
3. Four exams that all share students pairwise, i.e. K4 (expect 4 slots)
4. `input_large.txt` with 15+ exams and 40+ students (validation must pass, slots at most Δ + 1)
5. An empty file and a missing file (clean error messages)

If the two parts disagree, check the ID assignment order and the tie-breaking rule first.

Optional: a small graph where greedy uses more slots than the optimum, to show in the viva why greedy is not always optimal.

---

## 12. What You Can Say in the Viva

> "The main implementation is in C++ using only the standard library. Exams are vertices, shared students create edges, I sort vertices by degree, and give each the smallest slot not used by its neighbors. For the demo, I ported the same logic to JavaScript so it can run in a browser with a colored graph. I verified both give identical output on the same input."
