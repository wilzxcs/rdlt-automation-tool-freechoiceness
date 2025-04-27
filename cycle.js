/**
 * RDLT Cycle Detection Module
 * 
 * This module provides cycle detection and analysis functionality for the RDLT system.
 * It implements algorithms for identifying and analyzing cycles in RDLTs, which is essential
 * for understanding reusable patterns and computing metrics like expanded reusability (eRU).
 */
class Cycle {
  /**
   * Initialize the Cycle object with the provided list of arcs (R) for cycle detection.
   * @param {Array|Object} R - List or dictionary of arcs with their attributes
   */
  constructor(R) {
    this.R = R;
    this.Arcs_List = [];
    this.Vertices_List = [];
    this.processed_arcs = [];
    this.graph = {};
    this.global_cycle_counter = 0;
    this.Cycle_List = [];
    this.critical_arcs = [];
    this.eRU_list = [];
    this.Processing_Log = [];

    this.processArcs();
    this.graph = this.listToGraph(this.Arcs_List);
  }

  /**
   * Processes the arcs in self.R and stores them in Arcs_List and Vertices_List.
   */
  processArcs() {
    let arcList;
    
    if (Array.isArray(this.R)) {
      arcList = this.R;
    } else if (typeof this.R === 'object' && this.R !== null) {
      arcList = Object.values(this.R).flat();
    } else {
      throw new TypeError(`Expected R to be a list or dictionary, found ${typeof this.R}`);
    }

    for (const arcEntry of arcList) {
      const arc = arcEntry?.arc;
      const r_id = arcEntry?.['r-id'];

      if (typeof arc === 'string' && (typeof r_id === 'string' || typeof r_id === 'number')) {
        const [start_vertex, end_vertex] = arc.split(', ');
        this.Arcs_List.push({ r_id, start_vertex, end_vertex });
        this.Processing_Log.push(arcEntry);
      }
    }

    // Extract unique vertices
    const vertices = new Set();
    for (const arc of this.Arcs_List) {
      vertices.add(arc.start_vertex);
      vertices.add(arc.end_vertex);
    }
    this.Vertices_List = Array.from(vertices);
  }

  /**
   * Converts an edge list into a graph represented as an adjacency list.
   * @param {Array} edgeList - List of edges
   * @returns {Object} Graph represented as an adjacency list
   */
  listToGraph(edgeList) {
    const graph = {};
    for (const arc of edgeList) {
      if (!graph[arc.start_vertex]) {
        graph[arc.start_vertex] = [];
      }
      graph[arc.start_vertex].push(arc.end_vertex);
    }
    return graph;
  }

  /**
   * Finds an arc in R by its string representation.
   * @param {string} arcStr - Arc string in format "start, end"
   * @returns {Object|null} The arc entry or null if not found
   */
  findRByArc(arcStr) {
    if (typeof this.R === 'object' && this.R !== null && !Array.isArray(this.R)) {
      for (const rComponent of Object.values(this.R)) {
        if (Array.isArray(rComponent)) {
          for (const arcEntry of rComponent) {
            if (arcEntry?.arc === arcStr) {
              return arcEntry;
            }
          }
        }
      }
    } else if (Array.isArray(this.R)) {
      for (const arcEntry of this.R) {
        if (arcEntry?.arc === arcStr) {
          return arcEntry;
        }
      }
    }
    return null;
  }

  /**
   * Detects all cycles in the RDLT represented by the adjacency list.
   * @param {Object} adjList - Adjacency list representation of the RDLT
   * @returns {Array} List of cycles
   */
  findCycles(adjList) {
    const visited = new Set();
    const path = [];
    const pathSet = new Set();
    const cycles = [];

    // Create incoming edges graph for tracking joins
    const incomingEdges = {};
    for (const node in adjList) {
      for (const neighbor of adjList[node]) {
        if (!incomingEdges[neighbor]) {
          incomingEdges[neighbor] = [];
        }
        incomingEdges[neighbor].push(node);
      }
    }

    const isSameCycle = (cycle1, cycle2) => {
      if (cycle1.length !== cycle2.length) return false;
      
      const cycle1Str = cycle1.map(([start, end]) => `${start},${end}`);
      const cycle2Str = cycle2.map(([start, end]) => `${start},${end}`);
      const cycle2StrDoubled = [...cycle2Str, ...cycle2Str];
      
      for (let i = 0; i < cycle2Str.length; i++) {
        if (cycle1Str.every((val, j) => val === cycle2StrDoubled[i + j])) {
          return true;
        }
      }
      return false;
    };

    const isNewCycle = (newCycle) => {
      return !cycles.some(existingCycle => isSameCycle(newCycle, existingCycle));
    };

    const dfs = (node, parent = null, depth = 0, maxDepth = null) => {
      if (pathSet.has(node)) {
        const idx = path.indexOf(node);
        const cycle = path.slice(idx);
        const cycleArcs = cycle.map((v, i) => [v, cycle[i + 1] || node]);
        
        if (isNewCycle(cycleArcs)) {
          cycles.push(cycleArcs);
        }
        return;
      }

      if (maxDepth !== null && depth >= maxDepth) return;
      if (visited.has(node) && maxDepth === null) return;

      path.push(node);
      pathSet.add(node);

      if (maxDepth === null) {
        visited.add(node);
      }

      for (const neighbor of adjList[node] || []) {
        if (incomingEdges[neighbor]?.length > 1) {
          dfs(neighbor, node, depth + 1, maxDepth);
        } else {
          dfs(neighbor, node, depth + 1, maxDepth);
        }
      }

      path.pop();
      pathSet.delete(node);
    };

    // Start from join points first
    const joinPoints = Object.entries(incomingEdges)
      .filter(([_, sources]) => sources.length > 1)
      .map(([node]) => node);

    for (const node of joinPoints) {
      if (adjList[node] && !visited.has(node)) {
        path.length = 0;
        pathSet.clear();
        dfs(node);
      }
    }

    // Then check remaining nodes
    for (const node in adjList) {
      if (!visited.has(node)) {
        path.length = 0;
        pathSet.clear();
        dfs(node);
      }
    }

    return cycles;
  }

  /**
   * Stores detected cycles into the Cycle_List attribute with formatted information.
   * @returns {Array} The populated Cycle_List
   */
  storeToCycleList() {
    const cycles = this.findCycles(this.graph);
    this.Cycle_List = [];

    // Build a graph for connectivity analysis
    const arcGraph = {};
    for (const arc of this.Arcs_List) {
      if (!arcGraph[arc.start_vertex]) {
        arcGraph[arc.start_vertex] = new Set();
      }
      arcGraph[arc.start_vertex].add(arc.end_vertex);
    }

    // Identify join points
    const joinPoints = {};
    for (const arc of this.Arcs_List) {
      if (!joinPoints[arc.end_vertex]) {
        joinPoints[arc.end_vertex] = [];
      }
      joinPoints[arc.end_vertex].push(arc.start_vertex);
    }

    const actualJoinPoints = Object.fromEntries(
      Object.entries(joinPoints).filter(([_, sources]) => sources.length > 1)
    );

    for (const cycleArcs of cycles) {
      const cycleInRFormat = [];

      // Convert cycle arcs to R format
      for (const [start, end] of cycleArcs) {
        const arcStr = `${start}, ${end}`;
        const rArc = this.findRByArc(arcStr);
        if (rArc) {
          cycleInRFormat.push({ ...rArc });
        }
      }

      if (cycleInRFormat.length === 0) continue;

      // Extract vertices and build cycle graph
      const cycleVertices = new Set();
      const cycleGraph = {};
      const vertexToArcs = {};

      for (const arc of cycleInRFormat) {
        const [start, end] = arc.arc.split(', ');
        cycleVertices.add(start);
        cycleVertices.add(end);

        if (!cycleGraph[start]) {
          cycleGraph[start] = new Set();
        }
        cycleGraph[start].add(end);

        if (!vertexToArcs[start]) {
          vertexToArcs[start] = [];
        }
        vertexToArcs[start].push(arc);
      }

      // Handle join points
      const cycleJoinPoints = [...cycleVertices].filter(v => actualJoinPoints[v]);
      const consolidatedCycle = [...cycleInRFormat];

      for (const joinPoint of cycleJoinPoints) {
        const currentIncoming = cycleInRFormat.filter(
          arc => arc.arc.split(', ')[1] === joinPoint
        );

        for (const source of actualJoinPoints[joinPoint]) {
          if (currentIncoming.some(arc => arc.arc.split(', ')[0] === source)) {
            continue;
          }

          const arcStr = `${source}, ${joinPoint}`;
          const rArc = this.findRByArc(arcStr);

          if (rArc && cycleVertices.has(source)) {
            for (const startVertex of cycleVertices) {
              if (startVertex !== source && this.isConnected(cycleGraph, startVertex, source)) {
                consolidatedCycle.push({ ...rArc });
                if (!cycleGraph[source]) {
                  cycleGraph[source] = new Set();
                }
                cycleGraph[source].add(joinPoint);
                break;
              }
            }
          }
        }
      }

      // Find minimum l-attribute
      const lValues = [];
      for (const arc of consolidatedCycle) {
        if (arc['l-attribute'] !== undefined && arc['l-attribute'] !== null) {
          const lValue = String(arc['l-attribute']).replace(/\D/g, '');
          if (lValue) {
            lValues.push(parseInt(lValue));
          }
        }
      }

      if (lValues.length === 0) continue;

      const minL = Math.min(...lValues);

      // Identify critical arcs
      const criticalArcs = [];
      for (const arc of consolidatedCycle) {
        if (arc['l-attribute'] !== undefined && arc['l-attribute'] !== null) {
          const lValue = String(arc['l-attribute']).replace(/\D/g, '');
          if (lValue && parseInt(lValue) === minL) {
            criticalArcs.push({ ...arc });
          }
        }
      }

      // Create cycle entry
      const cycleId = `c-${this.Cycle_List.length + 1}`;
      this.Cycle_List.push({
        "cycle-id": cycleId,
        "cycle": consolidatedCycle,
        "ca": criticalArcs
      });

      // Update eRU for all arcs in this cycle
      for (const arc of consolidatedCycle) {
        arc.eRU = minL;
      }
    }

    return this.Cycle_List;
  }

  /**
   * Checks if there is a path from start to end in the graph.
   * @param {Object} graph - Graph representation
   * @param {string} start - Start vertex
   * @param {string} end - End vertex
   * @returns {boolean} True if connected, false otherwise
   */
  isConnected(graph, start, end) {
    if (start === end) return true;

    const visited = new Set();
    const queue = [start];

    while (queue.length > 0) {
      const current = queue.shift();

      if (current === end) return true;
      if (visited.has(current)) continue;

      visited.add(current);

      for (const neighbor of graph[current] || []) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }

    return false;
  }

  /**
   * Evaluates cycles in the RDLT and formats them for output.
   * @returns {Array} Formatted list of cycles
   */
  evaluateCycle() {
    this.storeToCycleList();

    const formattedCycles = this.Cycle_List
      .filter(cycle => cycle.cycle && cycle.cycle.length > 0)
      .map(cycle => ({
        'cycle-id': cycle['cycle-id'],
        'cycle': this.formatReadableR(cycle.cycle),
        'ca': this.formatReadableR(cycle.ca || [])
      }));

    return formattedCycles;
  }

  /**
   * Identifies critical arcs within a cycle based on l-attribute values.
   * @param {Array} cycleArcs - List of arcs in the cycle
   * @param {string} cycleId - Cycle identifier
   * @returns {Object} Cycle ID and critical arcs
   */
  findCriticalArcs(cycleArcs, cycleId) {
    if (!cycleArcs || cycleArcs.length === 0) {
      return { cycle_id: cycleId, critical_arcs: [] };
    }

    // Convert tuples to dictionary format if needed
    if (Array.isArray(cycleArcs[0])) {
      cycleArcs = cycleArcs.map((arc, i) => ({
        arc: `${arc[0]}, ${arc[1]}`,
        'l-attribute': '1', // Default value
        'r-id': `r-${i}`
      }));
    }

    const lAttributes = cycleArcs
      .map(arc => arc['l-attribute'])
      .filter(val => val !== undefined && val !== null)
      .map(val => parseInt(val));

    if (lAttributes.length === 0) {
      return { cycle_id: cycleId, critical_arcs: [] };
    }

    const minimumL = Math.min(...lAttributes);
    const criticalArcs = cycleArcs.filter(
      arc => parseInt(arc['l-attribute']) === minimumL
    );

    return { cycle_id: cycleId, critical_arcs };
  }

  /**
   * Formats arc data into a human-readable representation.
   * @param {Array} R - List of arcs
   * @returns {Array} List of formatted strings
   */
  formatReadableR(R) {
    return R.map(r => `${r['r-id']}: ${r.arc}`);
  }

  /**
   * Updates eRU values for all arcs based on cycle analysis.
   * @returns {Array} Updated R structure with eRU values
   */
  updateERUValues() {
    if (this.Cycle_List.length === 0) {
      this.storeToCycleList();
    }

    const arcToMinL = {};

    for (const cycleData of this.Cycle_List) {
      const cycleArcs = cycleData.cycle || [];
      const criticalArcs = cycleData.ca || [];

      if (criticalArcs.length === 0) continue;

      const minL = parseInt(criticalArcs[0]['l-attribute']);

      for (const arc of cycleArcs) {
        if (!arc.arc) continue;

        if (!arcToMinL[arc.arc]) {
          arcToMinL[arc.arc] = minL;
        } else {
          arcToMinL[arc.arc] = Math.min(arcToMinL[arc.arc], minL);
        }
      }
    }

    // Update the original R structure
    const updateR = (r) => {
      if (Array.isArray(r)) {
        return r.map(updateR);
      } else if (typeof r === 'object' && r !== null) {
        if (r.arc && arcToMinL[r.arc]) {
          return { ...r, eRU: arcToMinL[r.arc] };
        } else if (r.arc) {
          return { ...r, eRU: 0 };
        }
        return r;
      }
      return r;
    };

    this.R = updateR(this.R);
    return this.R;
  }

  /**
   * Returns the list of detected cycles.
   * @returns {Array} List of cycles
   */
  getCycleList() {
    return this.Cycle_List;
  }
}

