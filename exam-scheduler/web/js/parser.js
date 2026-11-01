// Parser for student input and CSV records
const Parser = {
    // Normalizes text lines into structured student-exam records
    parseStudentLines: function(text) {
        const lines = text.split(/\r?\n/);
        const studentMap = new Map(); // studentId -> Set of exam names
        const warnings = [];

        for (let i = 0; i < lines.length; i++) {
            const rawLine = lines[i];
            const trimmed = rawLine.trim();
            const lineNum = i + 1;

            if (trimmed === '') continue; // Skip blank lines

            const colonIdx = trimmed.indexOf(':');
            if (colonIdx === -1) {
                warnings.push(`Line ${lineNum}: Malformed line (missing colon): "${trimmed}"`);
                continue;
            }

            const studentId = trimmed.slice(0, colonIdx).trim();
            const examsPart = trimmed.slice(colonIdx + 1).trim();

            if (!studentId || !examsPart) {
                warnings.push(`Line ${lineNum}: Malformed line (empty student ID or exams): "${trimmed}"`);
                continue;
            }

            const rawExams = examsPart.split(',').map(e => e.trim()).filter(e => e.length > 0);
            if (rawExams.length === 0) {
                warnings.push(`Line ${lineNum}: No exams listed for student: "${studentId}"`);
                continue;
            }

            if (!studentMap.has(studentId)) {
                studentMap.set(studentId, new Map()); // lowerCase -> canonical
            }
            const studentExams = studentMap.get(studentId);

            rawExams.forEach(exam => {
                const lower = exam.toLowerCase();
                if (studentExams.has(lower)) {
                    warnings.push(`Line ${lineNum}: Duplicate exam "${exam}" for student "${studentId}" ignored.`);
                } else {
                    studentExams.set(lower, exam);
                }
            });
        }

        // Convert Map entries to Set of canonical exam names
        const finalMap = new Map();
        for (const [studentId, examMap] of studentMap.entries()) {
            finalMap.set(studentId, new Set(examMap.values()));
        }

        return { studentMap: finalMap, warnings };
    },

    // Parses CSV content in (student, exam) or (Student, Exam) format
    parseCsv: function(csvText) {
        const lines = csvText.split(/\r?\n/);
        const studentMap = new Map(); // studentId -> Map(lower -> canonical)
        const warnings = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNum = i + 1;
            if (line === '') continue;

            const parts = line.split(',').map(p => p.trim());
            if (parts.length < 2) {
                warnings.push(`Line ${lineNum}: Malformed CSV row (expected student,exam): "${line}"`);
                continue;
            }

            const studentId = parts[0];
            const examName = parts[1];

            // Ignore header row if present
            if (i === 0 && (studentId.toLowerCase() === 'student' || studentId.toLowerCase() === 'student id')) {
                continue;
            }

            if (!studentId || !examName) {
                warnings.push(`Line ${lineNum}: Missing student or exam field in CSV.`);
                continue;
            }

            if (!studentMap.has(studentId)) {
                studentMap.set(studentId, new Map());
            }
            const studentExams = studentMap.get(studentId);
            const lower = examName.toLowerCase();
            if (studentExams.has(lower)) {
                warnings.push(`Line ${lineNum}: Duplicate exam "${examName}" for student "${studentId}" ignored.`);
            } else {
                studentExams.set(lower, examName);
            }
        }

        const finalMap = new Map();
        for (const [studentId, examMap] of studentMap.entries()) {
            finalMap.set(studentId, new Set(examMap.values()));
        }

        return { studentMap: finalMap, warnings };
    }
};

// Export for Node.js test environment if present
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Parser;
}

