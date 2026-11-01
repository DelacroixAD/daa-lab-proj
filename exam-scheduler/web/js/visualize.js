// Visualizes the conflict graph using vis-network.
// Strictly obeys the prompt: vis-network ONLY draws the graph. It NEVER decides colors or slots.
const Visualizer = {
    networkInstance: null,

    // High-contrast neo-brutalist slot palette
    palette: [
        '#FFE600', '#FF3B30', '#00F0FF', '#34C759', '#AF52DE',
        '#FF9500', '#5856D6', '#FF2D55', '#4CD964', '#007AFF',
        '#E040FB', '#00E676'
    ],

    getColorForSlot: function(slotNumber) {
        if (!slotNumber || slotNumber <= 0) return '#000000';
        const index = (slotNumber - 1) % this.palette.length;
        return this.palette[index];
    },

    render: function(containerId, legendId, nodes, adjList, slots) {
        const container = document.getElementById(containerId);
        const legendContainer = document.getElementById(legendId);

        // Build vis-network dataset
        const visNodes = [];
        const visEdges = [];

        // Track slots present to render legend
        const slotsPresent = new Set();

        for (let i = 0; i < nodes.length; i++) {
            const slot = slots[i];
            slotsPresent.add(slot);
            const color = this.getColorForSlot(slot);

            visNodes.push({
                id: nodes[i].id,
                label: `${nodes[i].name}\n[SLOT ${slot}]`,
                color: {
                    background: color,
                    border: '#000000',
                    highlight: {
                        background: color, // Preserves authentic slot color, never turns yellow!
                        border: '#000000'
                    },
                    hover: {
                        background: color,
                        border: '#000000'
                    }
                },
                font: {
                    color: '#000000',
                    face: 'Space Mono, monospace',
                    size: 13,
                    bold: true
                },
                shape: 'dot',
                size: 22,
                borderWidth: 3,
                borderWidthSelected: 6 // Thick bold border when selected
            });
        }

        const seenEdges = new Set();
        for (let u = 0; u < adjList.length; u++) {
            for (const v of adjList[u]) {
                const edgeKey = u < v ? `${u}-${v}` : `${v}-${u}`;
                if (!seenEdges.has(edgeKey)) {
                    seenEdges.add(edgeKey);
                    visEdges.push({
                        from: u,
                        to: v,
                        color: {
                            color: '#9E9E9E',      // Neutral gray default so conflict lines are distinct
                            highlight: '#000000',  // Bold solid black highlight (NOT yellow)
                            hover: '#000000'
                        },
                        width: 2,
                        selectionWidth: 4,         // Thick 4px line highlighting active conflicts
                        hoverWidth: 3
                    });
                }
            }
        }

        const data = {
            nodes: new vis.DataSet(visNodes),
            edges: new vis.DataSet(visEdges)
        };

        const options = {
            physics: {
                solver: 'forceAtlas2Based',
                forceAtlas2Based: {
                    gravitationalConstant: -120,
                    centralGravity: 0.01,
                    springLength: 170,
                    springConstant: 0.05,
                    damping: 0.4,
                    avoidOverlap: 1
                },
                stabilization: {
                    enabled: true,
                    iterations: 200
                }
            },
            interaction: {
                hover: true,
                dragNodes: true,
                zoomView: true
            }
        };

        if (this.networkInstance) {
            this.networkInstance.destroy();
        }

        this.networkInstance = new vis.Network(container, data, options);

        // Wait for physics to stabilize before fitting the view
        this.networkInstance.once('stabilizationIterationsDone', () => {
            this.networkInstance.fit({
                animation: {
                    duration: 500,
                    easingFunction: 'easeInOutQuad'
                }
            });
        });

        // Render plain-text legend with colored swatches
        legendContainer.innerHTML = '';
        const sortedSlots = Array.from(slotsPresent).sort((a, b) => a - b);
        sortedSlots.forEach(slot => {
            const color = this.getColorForSlot(slot);
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `<span class="legend-swatch" style="background-color: ${color};"></span> Slot ${slot}`;
            legendContainer.appendChild(item);
        });
    }
};

