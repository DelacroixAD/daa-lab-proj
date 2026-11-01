// UI controller wiring parser, graph, coloring, validation, and visualizer
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('input-textarea');
    const btnSmall = document.getElementById('btn-small');
    const btnLarge = document.getElementById('btn-large');
    const btnGenerate = document.getElementById('btn-generate');
    const csvUpload = document.getElementById('csv-upload');
    const inlineMsg = document.getElementById('inline-message');

    // Default to small sample
    textarea.value = SAMPLE_SMALL;

    btnSmall.addEventListener('click', () => {
        textarea.value = SAMPLE_SMALL;
        inlineMsg.innerHTML = '';
        runPipeline(SAMPLE_SMALL, 'text');
    });

    btnLarge.addEventListener('click', () => {
        textarea.value = SAMPLE_LARGE;
        inlineMsg.innerHTML = '';
        runPipeline(SAMPLE_LARGE, 'text');
    });

    btnGenerate.addEventListener('click', () => {
        inlineMsg.innerHTML = '';
        runPipeline(textarea.value, 'text');
    });

    csvUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const content = evt.target.result;
            textarea.value = content;
            inlineMsg.innerHTML = '';
            runPipeline(content, 'csv');
        };
        reader.readAsText(file);
    });

    // Collapsible plain-text toggles ("Show" / "Hide"), collapsed by default
    const toggleStudentBtn = document.getElementById('toggle-student-btn');
    const studentContent = document.getElementById('student-schedule-content');
    if (toggleStudentBtn && studentContent) {
        toggleStudentBtn.addEventListener('click', () => {
            const isCollapsed = studentContent.classList.toggle('collapsed');
            toggleStudentBtn.textContent = isCollapsed ? 'Show' : 'Hide';
            toggleStudentBtn.setAttribute('aria-expanded', !isCollapsed);
        });
    }

    const toggleStepsBtn = document.getElementById('toggle-steps-btn');
    const stepsContent = document.getElementById('steps-content');
    if (toggleStepsBtn && stepsContent) {
        toggleStepsBtn.addEventListener('click', () => {
            const isCollapsed = stepsContent.classList.toggle('collapsed');
            toggleStepsBtn.textContent = isCollapsed ? 'Show' : 'Hide';
            toggleStepsBtn.setAttribute('aria-expanded', !isCollapsed);
        });
    }

    // Automatically run initial schedule on load
    runPipeline(textarea.value, 'text');

    function runPipeline(inputContent, mode) {
        if (!inputContent || inputContent.trim() === '') {
            inlineMsg.innerHTML = '<span class="warning-item">Input is empty. Please enter student courses or load a sample.</span>';
            clearOutputs();
            return;
        }

        try {
            // 1. Parse input
            const parseResult = mode === 'csv' 
                ? Parser.parseCsv(inputContent) 
                : Parser.parseStudentLines(inputContent);

            // Display any parsing warnings
            if (parseResult.warnings.length > 0) {
                inlineMsg.innerHTML = parseResult.warnings.map(w => `<div class="warning-item">[Notice] ${escapeHtml(w)}</div>`).join('');
            } else {
                inlineMsg.innerHTML = '';
            }

            if (parseResult.studentMap.size === 0) {
                clearOutputs();
                return;
            }

            // 2. Build graph
            const graph = GraphBuilder.buildGraph(parseResult.studentMap);
            if (graph.nodes.length === 0) {
                clearOutputs();
                return;
            }

            // 3. Compute stats
            const stats = GraphBuilder.computeStats(graph.nodes, graph.adjList);

            // 4. Color graph using Welch-Powell
            const coloring = welchPowellColoring(graph.adjList);

            // 5. Validate coloring
            const validation = validateColoring(graph.adjList, coloring.slots);

            // 6. Update UI
            updateScheduleTable(graph.nodes, coloring);
            updateSlotScheduleTable(graph.nodes, coloring);
            updateStudentSchedulesTable(parseResult.studentMap, graph, coloring);
            updateStats(stats, coloring.totalSlotsUsed);
            updateValidation(validation, graph.nodes, coloring.slots);
            updateStepsTable(coloring.steps, graph.nodes);
            Visualizer.render('graph-container', 'graph-legend', graph.nodes, graph.adjList, coloring.slots);
        } catch (err) {
            console.error(err);
            inlineMsg.innerHTML = `<div class="warning-item">[Error] Unable to process input: ${escapeHtml(err.message)}</div>`;
            clearOutputs();
        }
    }

    function updateScheduleTable(nodes, coloring) {
        const tbody = document.getElementById('schedule-tbody');
        const summary = document.getElementById('schedule-summary');
        summary.textContent = `A total of ${coloring.totalSlotsUsed} distinct time slots are required to resolve all student exam conflicts.`;

        tbody.innerHTML = '';
        nodes.forEach(node => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${node.id}</td>
                <td>${escapeHtml(node.name)}</td>
                <td>Slot ${coloring.slots[node.id]}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function updateSlotScheduleTable(nodes, coloring) {
        const tbody = document.getElementById('slot-schedule-tbody');
        tbody.innerHTML = '';

        if (!coloring.totalSlotsUsed || coloring.totalSlotsUsed === 0) {
            tbody.innerHTML = '<tr><td colspan="2" class="empty-cell">No schedule generated yet.</td></tr>';
            return;
        }

        // Group exams by assigned slot
        const slotMap = new Map();
        for (let s = 1; s <= coloring.totalSlotsUsed; s++) {
            slotMap.set(s, []);
        }

        nodes.forEach(node => {
            const slot = coloring.slots[node.id];
            if (slotMap.has(slot)) {
                slotMap.get(slot).push(node.name);
            }
        });

        for (let s = 1; s <= coloring.totalSlotsUsed; s++) {
            const exams = slotMap.get(s) || [];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>Slot ${s}</strong></td>
                <td>${escapeHtml(exams.join(', '))}</td>
            `;
            tbody.appendChild(tr);
        }
    }

    function updateStudentSchedulesTable(studentMap, graph, coloring) {
        const tbody = document.getElementById('student-schedule-tbody');
        tbody.innerHTML = '';

        // Sort students naturally (e.g., S1, S2, ..., S10)
        const studentIds = Array.from(studentMap.keys()).sort((a, b) => {
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        });

        studentIds.forEach(studentId => {
            const rawExams = Array.from(studentMap.get(studentId));
            
            // Map each exam to its slot and canonical name
            const studentExamSlots = [];
            rawExams.forEach(examName => {
                const key = examName.trim().toLowerCase();
                if (graph.nameToId.has(key)) {
                    const id = graph.nameToId.get(key);
                    const slot = coloring.slots[id];
                    studentExamSlots.push({
                        name: graph.nodes[id].name,
                        slot: slot
                    });
                }
            });

            // Sort student's exams in chronological slot order
            studentExamSlots.sort((a, b) => a.slot - b.slot);

            const scheduleHtml = `<div class="student-schedule-list">` +
                studentExamSlots.map(item => 
                    `<span class="student-schedule-item"><span class="slot-label">Slot ${item.slot}:</span> <span>${escapeHtml(item.name)}</span></span>`
                ).join('') +
                `</div>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(studentId)}</strong></td>
                <td>${scheduleHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function updateStats(stats, slotsUsed) {
        document.getElementById('stat-vertices').textContent = stats.numVertices;
        document.getElementById('stat-edges').textContent = stats.numEdges;
        document.getElementById('stat-degree').textContent = stats.maxDegree;
        document.getElementById('stat-upper-bound').textContent = `${stats.upperBound} slots`;
        document.getElementById('stat-slots-used').textContent = `${slotsUsed} slots`;
    }

    function updateValidation(validation, nodes, slots) {
        const statusEl = document.getElementById('validation-status');
        const detailsEl = document.getElementById('validation-details');

        if (validation.isValid) {
            statusEl.className = 'validation-status success';
            statusEl.textContent = '[✓] VALIDATION: NO CONFLICTS FOUND';
            detailsEl.textContent = 'All adjacent exams with common student enrollments are assigned to mutually exclusive time slots.';
        } else {
            statusEl.className = 'validation-status error';
            statusEl.textContent = '[✖] VALIDATION FAILED (' + validation.conflicts.length + ' CONFLICTS DETECTED)';
            const items = validation.conflicts.map(([u, v]) => 
                `Conflict between "${escapeHtml(nodes[u].name)}" (Slot ${slots[u]}) and "${escapeHtml(nodes[v].name)}" (Slot ${slots[v]})`
            );
            detailsEl.innerHTML = items.join('<br>');
        }
    }

    function updateStepsTable(steps, nodes) {
        const tbody = document.getElementById('steps-tbody');
        tbody.innerHTML = '';

        steps.forEach((step, idx) => {
            const tr = document.createElement('tr');
            const neighborStr = step.neighborSlots.length > 0 
                ? `{${step.neighborSlots.join(', ')}}` 
                : '∅';

            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${escapeHtml(nodes[step.vertexId].name)} (ID ${step.vertexId})</td>
                <td>${step.degree}</td>
                <td>${neighborStr}</td>
                <td>Slot ${step.assignedSlot}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function clearOutputs() {
        document.getElementById('schedule-tbody').innerHTML = '<tr><td colspan="3" class="empty-cell">No schedule available.</td></tr>';
        document.getElementById('slot-schedule-tbody').innerHTML = '<tr><td colspan="2" class="empty-cell">No schedule available.</td></tr>';
        document.getElementById('student-schedule-tbody').innerHTML = '<tr><td colspan="2" class="empty-cell">No student timetables available.</td></tr>';
        document.getElementById('steps-tbody').innerHTML = '<tr><td colspan="5" class="empty-cell">No steps available.</td></tr>';
        document.getElementById('validation-status').className = 'validation-status';
        document.getElementById('validation-status').textContent = 'Awaiting valid input...';
        document.getElementById('validation-details').textContent = '';
        document.getElementById('stat-vertices').textContent = '0';
        document.getElementById('stat-edges').textContent = '0';
        document.getElementById('stat-degree').textContent = '0';
        document.getElementById('stat-upper-bound').textContent = '0';
        document.getElementById('stat-slots-used').textContent = '0';
        if (Visualizer.networkInstance) {
            Visualizer.networkInstance.destroy();
            Visualizer.networkInstance = null;
        }
        document.getElementById('graph-legend').innerHTML = '';
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});

