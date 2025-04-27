class InputRDLT {
  constructor() {
    this.contents = { R: [], CENTER: [], IN: [], OUT: [] };
    this.Arcs_List = [];
    this.Vertices_List = [];
    this.C_attribute_list = [];
    this.L_attribute_list = [];
    this.Centers_list = [];
    this.user_input_to_evsa = [];
    this.In_list = [];
    this.Out_list = [];
    this.Cycle_List = [];
    this.adjacencyMatrix = [];
    this.siblingGroups = [];
    this.backEdges = [];
    this.sourceVertex = null;
    this.constraintCheckResults = [];
  }

  readFile(fileContent) {
    const data = fileContent.split("\n");
    let currentSection = "R";

    data.forEach((line) => {
      line = line.trim();
      if (line.startsWith("CENTER")) {
        currentSection = "CENTER";
      } else if (line.startsWith("IN")) {
        currentSection = "IN";
      } else if (line.startsWith("OUT")) {
        currentSection = "OUT";
      } else if (line) {
        this.contents[currentSection].push(line);
      }
    });

    this.Centers_list = this.contents.CENTER.flatMap((line) =>
      line
        .split(",")
        .map((center) => center.trim())
        .filter((center) => center)
    );
    this.In_list = this.contents.IN.filter((line) => line);
    this.Out_list = this.contents.OUT.filter((line) => line);
  }

  evaluate() {
    // Process R section to extract arcs and attributes
    const R_list = this.contents.R.map((line) => {
      const [x1, x2, cAttr, lAttr] = line.split(", ");
      return {
        arc: `${x1}, ${x2}`,
        "c-attribute": cAttr,
        "l-attribute": lAttr,
      };
    });

    this.Arcs_List = R_list.map((i) => i.arc);
    this.C_attribute_list = R_list.map((i) => i["c-attribute"]);
    this.L_attribute_list = R_list.map((i) => i["l-attribute"]);

    // Extract unique vertices
    const uniqueVertices = new Set();
    this.Arcs_List.forEach((arc) => {
      const [from, to] = arc.split(", ");
      uniqueVertices.add(from);
      uniqueVertices.add(to);
    });
    this.Vertices_List = Array.from(uniqueVertices);

    console.log("vertices: ", this.Vertices_List);
    console.log("arcs: ", this.Arcs_List);
    console.log("cAttr: ", this.C_attribute_list);
    console.log("lAttr: ", this.L_attribute_list);
    console.log("Centers: ", this.Centers_list);
    console.log("IN: ", this.In_list);
    console.log("OUT: ", this.Out_list);

    // Build adjacency matrix and perform analyses
    this.constructAdjacencyMatrix();
    this.identifyBackEdges();
    this.identifySourceVertex();
  }
  // evaluate() {
  //   // Helper functions
  //   const extractR = (line) => {
  //     const L = line.split(", ");
  //     if (L.length < 4) return null;
  //     return {
  //       arc: `${L[0]}, ${L[1]}`,
  //       "c-attribute": L[2],
  //       "l-attribute": L[3],
  //     };
  //   };

  //   const extractVertices = (arcList) => {
  //     const uniqueVertices = new Set();
  //     arcList.forEach((arc) => {
  //       const [v1, v2] = arc.split(", ");
  //       uniqueVertices.add(v1);
  //       uniqueVertices.add(v2);
  //     });
  //     return Array.from(uniqueVertices).sort();
  //   };

  //   const convertArcFormat = (arc) => {
  //     const [v1, v2] = arc.split(", ");
  //     return `(${v1}, ${v2})`;
  //   };

  //   const convertArcListFormat = (arcList) => {
  //     return arcList.map((arc) => convertArcFormat(arc));
  //   };

  //   // Process R section
  //   const R_list = this.contents.R.map(extractR).filter((x) => x !== null);

  //   this.Arcs_List = R_list.map((i) => i.arc);
  //   this.Vertices_List = extractVertices(this.Arcs_List);
  //   this.C_attribute_list = R_list.map((i) => i["c-attribute"]);
  //   this.L_attribute_list = R_list.map((i) => i["l-attribute"]);

  //   // Debug output
  //   console.log("\nInput RDLT:");
  //   console.log("-".repeat(20));
  //   console.log(
  //     `Arcs List (${this.Arcs_List.length}):`,
  //     convertArcListFormat(this.Arcs_List)
  //   );
  //   console.log(
  //     `Vertices List (${this.Vertices_List.length}):`,
  //     this.Vertices_List
  //   );
  //   console.log(
  //     `C-attribute List (${this.C_attribute_list.length}):`,
  //     this.C_attribute_list
  //   );
  //   console.log(
  //     `L-attribute List (${this.L_attribute_list.length}):`,
  //     this.L_attribute_list
  //   );

  //   if (this.Centers_list.length) {
  //     console.log("-".repeat(20));
  //     console.log("RBS components:");
  //     console.log("-".repeat(20));
  //     console.log(`Centers (${this.Centers_list.length}):`, this.Centers_list);
  //     console.log(
  //       `In (${this.In_list.length}):`,
  //       convertArcListFormat(this.In_list)
  //     );
  //     console.log(
  //       `Out (${this.Out_list.length}):`,
  //       convertArcListFormat(this.Out_list)
  //     );
  //   }
  //   console.log("=".repeat(60));

  //   // Process RDLT structures
  //   const rdlts_raw = this.Centers_list.map((center, i) => ({
  //     [`R${i + 2}-${center}`]: [],
  //   }));

  //   const extractRdlt = (rdlt) => {
  //     for (const key in rdlt) {
  //       if (key.includes("-")) {
  //         const [r, centerVertex] = key.split("-");
  //         rdlt[key] = this.Arcs_List.filter((arc) =>
  //           arc.includes(centerVertex)
  //         );
  //         const finalRdlt = rdlt[key].filter(
  //           (arc) => !this.In_list.includes(arc) && !this.Out_list.includes(arc)
  //         );
  //         const finalVertices = extractVertices(finalRdlt);
  //         const finalArcs = this.Arcs_List.filter((arc) => {
  //           const [v1, v2] = arc.split(", ");
  //           return finalVertices.includes(v1) && finalVertices.includes(v2);
  //         });
  //         return { [r]: finalArcs };
  //       } else {
  //         console.warn(`[WARNING] Skipping invalid key format: ${key}`);
  //         return null;
  //       }
  //     }
  //     return null;
  //   };

  //   const rdlts = rdlts_raw
  //     .map((r) => extractRdlt(r))
  //     .filter((r) => r !== null);

  //   // Get used arcs
  //   const usedArcs = rdlts.flatMap((rdlt) => Object.values(rdlt).flat());
  //   rdlts.push({ R1: this.Arcs_List.filter((arc) => !usedArcs.includes(arc)) });

  //   const finalTransformR = (rdlt) => {
  //     for (const key in rdlt) {
  //       return {
  //         [key]: rdlt[key].map((x) => ({
  //           "r-id": `${key}-${this.Arcs_List.indexOf(x)}`,
  //           arc: x,
  //           "l-attribute": this.L_attribute_list[this.Arcs_List.indexOf(x)],
  //           "c-attribute": this.C_attribute_list[this.Arcs_List.indexOf(x)],
  //           eRU: 0,
  //         })),
  //       };
  //     }
  //     return {};
  //   };

  //   this.user_input_to_evsa = rdlts.map((rdlt) => finalTransformR(rdlt));

  //   console.log(this.user_input_to_evsa);

  //   // Compute eRU for R1
  //   const R1 = this.getR("R1");
  //   if (R1 && Array.isArray(R1)) {
  //     this._computeERU(R1);
  //   }
  // }

  // _computeERU(R1) {
  //   // This would require the Cycle class implementation in JavaScript
  //   // For now, we'll just outline the structure
  //   const cycleInstance = new Cycle(R1);
  //   const cycleR1 = cycleInstance.evaluateCycle();

  //   if (cycleR1) {
  //     cycleR1.forEach(cycleData => {
  //       const cycleArcs = cycleData.cycle;
  //       const cycleLAttributes = [];

  //       cycleArcs.forEach(cycleArc => {
  //         const [rId, arcName] = cycleArc.split(': ');
  //         const actualArc = utils.getArcFromRid(rId, R1);

  //         if (actualArc) {
  //           const matchingArc = R1.find(r => r.arc === actualArc);
  //           if (matchingArc) {
  //             const lAttribute = matchingArc['l-attribute'];
  //             if (lAttribute !== undefined) {
  //               cycleLAttributes.push(parseInt(lAttribute));
  //             } else {
  //               console.warn(`Warning: 'l-attribute' not found for arc ${actualArc}`);
  //             }
  //           } else {
  //             console.warn(`Warning: No matching arc found for ${actualArc} in R1`);
  //           }
  //         } else {
  //           console.warn(`Warning: No arc found in R1 for r-id ${rId}`);
  //         }
  //       });

  //       const ca = cycleLAttributes.length ? Math.min(...cycleLAttributes) : null;

  //       if (ca !== null) {
  //         cycleArcs.forEach(cycleArc => {
  //           const [rId] = cycleArc.split(': ');
  //           const actualArc = utils.getArcFromRid(rId, R1);
  //           if (actualArc) {
  //             const matchingArc = R1.find(r => r.arc === actualArc);
  //             if (matchingArc) {
  //               matchingArc.eRU = ca;
  //             }
  //           }
  //         });
  //       }
  //     });
  //   }
  // }

  // getRs() {
  //   return this.user_input_to_evsa.filter(R => !('R1' in R));
  // }

  // getR(R) {
  //   for (const dictionary of this.user_input_to_evsa) {
  //     if (dictionary && R in dictionary) {
  //       return dictionary[R];
  //     }
  //   }
  //   return `[WARNING] ${R} has not been defined or is missing.`;
  // }

  constructAdjacencyMatrix() {
    const size = this.Vertices_List.length;
    this.adjacencyMatrix = Array(size)
      .fill()
      .map(() => Array(size).fill(0));

    this.Arcs_List.forEach((arc) => {
      const [from, to] = arc.split(", ");
      const fromIndex = this.Vertices_List.indexOf(from);
      const toIndex = this.Vertices_List.indexOf(to);
      if (fromIndex !== -1 && toIndex !== -1) {
        this.adjacencyMatrix[fromIndex][toIndex] = 1;
      }
    });
  }

  // Phases to verify Sigma-distincs PCS

  verifyPhase1() {
    const startTime = performance.now();
    const issues = [];
    let someValid = false;

    // Step 0: Filter children

    const filteredChildren = this.filterChildVectors();

    // Step 1: Find all possible composite vectors
    const compositeVectors = this.findValidCompositeVectors(filteredChildren);
    const validVectors = [];

    if (compositeVectors.length <= 0) {
      issues.push({
        type: "error",
        message: `There are no siblings with the same set of parents. The RDLT is not Σ-distinct PCS.`,
      });
    }

    // Step 2: Validate each composite vector
    compositeVectors.forEach((vector) => {
      const matrix = this.buildConstraintMatrixForVector(vector);
      console.log("Constraint Matrix" + matrix);
      const isValid = matrix.slice(1).every((row) => row[1] === "1");

      if (isValid) {
        validVectors.push(vector);
        someValid = true;
      } else {
        issues.push({
          type: "error",
          message: `Composite vector ${vector.name} failed constraint checks`,
          vector: vector.name,
          matrix: matrix,
        });
      }
    });

    console.log("Composite Vectors: " + compositeVectors);

    // Step 3: Extract unique vertices from valid vectors
    const retainedVertices = new Set();
    validVectors.forEach((vector) => {
      vector.parents.forEach((vertex) => retainedVertices.add(vertex));
    });

    const endTime = performance.now();

    return {
      executionTime: endTime - startTime,
      valid: someValid,
      retainedVertices: Array.from(retainedVertices).sort(),
      issues,
      validCompositeVectors: validVectors,
    };
  }

  verifyPhase2(validCompositeVectors) {
    // Step 1: Extract all unique vertices from valid composite vectors
    const phase2Vertices = new Set();
    validCompositeVectors.forEach((vector) => {
      vector.parents.forEach((vertex) => phase2Vertices.add(vertex));
    });

    // Step 2: Get sibling groups containing these vertices
    const relevantSiblingGroups = this.getSiblingGroups().filter((group) =>
      group.some((vertex) => phase2Vertices.has(vertex))
    );

    // Step 3: Prepare results
    const results = {
      isValid: true,
      message: "RDLT is Σ-distinct PCS free-choice.",
      violations: [],
    };

    // Step 4: Process each relevant sibling group
    for (const group of relevantSiblingGroups) {
      const filteredGroup = group.filter((x) => phase2Vertices.has(x));

      if (filteredGroup.length === 0) continue;

      const posSets = {};
      filteredGroup.forEach((x) => {
        posSets[x] = new Set(this.findAllPOS(x));
      });

      const POSall = new Set();
      filteredGroup.forEach((x) => {
        posSets[x].forEach((v) => POSall.add(v));
      });

      for (const w of POSall) {
        for (const x of filteredGroup) {
          const { antecedent: antecedent_x } =
            this.findMaximalAntecedentAndConsequent(x);
          if (!antecedent_x.includes(w)) {
            results.isValid = false;
            results.violations.push({
              siblingGroup: filteredGroup,
              vertex: x,
              missingInAntecedent: w,
              posAll: Array.from(POSall),
              antecedent: antecedent_x,
            });
          }
        }
      }
    }

    if (!results.isValid) {
      results.message = "RDLT is not Σ-distinct PCS free-choice";
    }

    return results;
  }

  // Phase 1 Methods
  filterChildVectors() {
    const retainedChildren = [];

    // Transpose the matrix to work with child vectors (columns become rows)
    const transposedMatrix = this.adjacencyMatrix[0].map((_, colIndex) =>
      this.adjacencyMatrix.map((row) => row[colIndex])
    );

    transposedMatrix.forEach((childVector, childIndex) => {
      const sum = childVector.reduce((acc, val) => acc + val, 0);

      if (sum > 1) {
        retainedChildren.push(this.Vertices_List[childIndex]);
      }
    });

    if (retainedChildren.length === 0) {
      console.log("No sibling vertices found.");
    }
    console.log("Filtered Children: " + retainedChildren);

    return retainedChildren;
  }

  findValidCompositeVectors(vertices) {
    // Validate input
    if (!Array.isArray(vertices) || vertices.length < 2) {
      return [];
    }

    const validVectors = [];
    const vertexIndices = new Map(vertices.map((v, i) => [v, i]));

    // Generate all unique vertex pairs
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const vertexA = vertices[i];
        const vertexB = vertices[j];

        // Get adjacency vectors
        const vectorA = this.getAdjacencyVector(vertexA);
        const vectorB = this.getAdjacencyVector(vertexB);

        // Compute bitwise AND
        const bitwiseResult = this.computeBitwiseAND(vectorA, vectorB);

        // Check if the result preserves both original vectors
        if (this.isValidComposite(vectorA, vectorB, bitwiseResult)) {
          validVectors.push({
            name: this.generateCompositeName(vertexA, vertexB),
            parents: [vertexA, vertexB],
            vector: bitwiseResult,
            // Additional useful metadata:
            vectorA,
            vectorB,
            indexA: vertexIndices.get(vertexA),
            indexB: vertexIndices.get(vertexB),
          });
        }
      }
    }

    return validVectors;
  }

  isValidComposite(vectorA, vectorB, result) {
    return (
      vectorA.every((v, i) => v === result[i]) &&
      vectorB.every((v, i) => v === result[i])
    );
  }

  generateCompositeName(vertexA, vertexB) {
    return `CV_${vertexA},${vertexB}`; // More descriptive name format
  }

  computeBitwiseAND(vectorA, vectorB) {
    return vectorA.map((val, i) => val & vectorB[i]);
  }

  buildConstraintMatrixForVector(compositeVector) {
    const matrix = [];
    const header = ["", compositeVector.name];
    matrix.push(header);

    const allVertices = this.getVerticesList();
    const constraintMap = new Map();

    // Collect all constraints and build raw matrix
    const rawMatrix = allVertices.map((parent) => {
      const constraints = compositeVector.parents.map((vertex) =>
        this.getConstraintBetween(parent, vertex)
      );

      // Count non-zero constraints
      constraints.forEach((constraint) => {
        if (constraint !== "0") {
          constraintMap.set(
            constraint,
            (constraintMap.get(constraint) || 0) + 1
          );
        }
      });

      return [parent, constraints];
    });

    // Add processed rows to the final matrix
    rawMatrix.forEach(([parent, constraints]) => {
      const allZero = constraints.every((c) => c === "0");
      const noDuplicates = Array.from(constraintMap.values()).every(
        (count) => count <= 1
      );
      const value = allZero || noDuplicates ? "1" : "0";
      matrix.push([parent, value]);
    });

    return matrix;
  }

  getConstraintBetween(parent, child) {
    const arc = `${parent}, ${child}`;
    const index = this.Arcs_List.indexOf(arc);
    if (index === -1) return "0"; // No arc exists

    const constraint = this.C_attribute_list[index];
    return constraint === "ε" ? "0" : constraint;
  }

  // Phase 2 Methods
  identifyBackEdges() {
    const n = this.Vertices_List.length;
    const halfAdjMatrix = this.adjacencyMatrix.map((row, i) =>
      row.map((cell, j) => (j <= i ? 0 : cell))
    );

    this.backEdges = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (this.adjacencyMatrix[i][j] === 1 && halfAdjMatrix[i][j] === 0) {
          this.backEdges.push(
            `${this.Vertices_List[i]} -> ${this.Vertices_List[j]}`
          );
        }
      }
    }
  }

  identifySourceVertex() {
    const incomingCount = new Array(this.Vertices_List.length).fill(0);

    for (let i = 0; i < this.Vertices_List.length; i++) {
      for (let j = 0; j < this.Vertices_List.length; j++) {
        if (this.adjacencyMatrix[i][j] === 1) {
          incomingCount[j]++;
        }
      }
    }

    const sourceIndex = incomingCount.indexOf(0);
    if (sourceIndex !== -1) {
      this.sourceVertex = this.Vertices_List[sourceIndex];
    }
  }



  findMaximalAntecedentAndConsequent(x) {
    if (!this.sourceVertex) {
      return { antecedent: [], consequent: [] };
    }

    // Step 1: Get all back edges
    const loopingArcs = this.backEdges.map((edge) => {
      const [from, to] = edge.split(" -> ");
      return { from, to };
    });

    // Step 2: Calculate antecedent (all paths from source to x)
    const allPathsToX = this.findAllPaths(this.sourceVertex, x);
    let antecedent_x = [...new Set(allPathsToX.flat())].sort();

    // Step 3: Calculate consequent using the new rule
    const consequent_x = new Set();
    const visited = new Set();

    const backEdgeOrigins = new Set(
      this.backEdges.map((edge) => edge.split(" -> ")[0])
    );

    const dfs = (current) => {
      if (visited.has(current)) return;
      visited.add(current);

      const currentIndex = this.Vertices_List.indexOf(current);

      for (let i = 0; i < this.Vertices_List.length; i++) {
        if (this.adjacencyMatrix[currentIndex][i] === 1) {
          const next = this.Vertices_List[i];
          if (!antecedent_x.includes(next)) {
            consequent_x.add(next);
          }

          // Stop if next is a backedge origin
          if (backEdgeOrigins.has(next)) {
            continue;
          }

          dfs(next);
        }
      }
    };

    dfs(x);

    return {
      antecedent: antecedent_x,
      consequent: [...consequent_x].sort(),
    };
  }

  findConsequentWithBackedgeStop(x) {
    if (!this.sourceVertex) {
      return [];
    }

    const consequent = new Set();
    const visited = new Set();

    // Step 1: Find all vertices that are origins of back edges
    const backEdgeOrigins = new Set(
      this.backEdges.map((edge) => edge.split(" -> ")[0])
    );

    const dfs = (current) => {
      if (visited.has(current)) return;
      visited.add(current);

      const currentIndex = this.Vertices_List.indexOf(current);

      for (let i = 0; i < this.Vertices_List.length; i++) {
        if (this.adjacencyMatrix[currentIndex][i] === 1) {
          const next = this.Vertices_List[i];

          consequent.add(next);

          // If next is a back edge origin, include it and STOP
          if (backEdgeOrigins.has(next)) {
            continue;
          }

          // Otherwise, continue traversing
          dfs(next);
        }
      }
    };

    dfs(x);

    return [...consequent].sort();
  }

  findAllPaths(from, to) {
    const paths = [];
    const visited = new Set();
    const currentPath = [];

    const dfs = (current) => {
      visited.add(current);
      currentPath.push(current);

      if (current === to) {
        paths.push([...currentPath]);
      } else {
        const currentIndex = this.Vertices_List.indexOf(current);
        for (let i = 0; i < this.Vertices_List.length; i++) {
          if (
            this.adjacencyMatrix[currentIndex][i] === 1 &&
            !visited.has(this.Vertices_List[i])
          ) {
            dfs(this.Vertices_List[i]);
          }
        }
      }

      currentPath.pop();
      visited.delete(current);
    };

    dfs(from);
    return paths;
  }

  findAllPOS(x) {
    if (!this.sourceVertex) {
      console.error("No source vertex found in the graph");
      return [];
    }

    const POS_x = new Set();
    const { antecedent, consequent } =
      this.findMaximalAntecedentAndConsequent(x);

    for (const c of consequent) {
      for (const a of antecedent) {
        if (this.Arcs_List.includes(`${c}, ${a}`)) {
          POS_x.add(a);
        }
      }
    }

    POS_x.add(this.sourceVertex);
    return Array.from(POS_x).sort();
  }

  // Getters
  getAdjacencyMatrix() {
    return this.adjacencyMatrix;
  }

  getSiblingGroups() {
    return this.siblingGroups;
  }

  getBackEdges() {
    return this.backEdges;
  }

  getVerticesList() {
    return this.Vertices_List;
  }

  getAdjacencyVector(vertex) {
    const index = this.Vertices_List.indexOf(vertex);
    return index === -1
      ? []
      : this.Vertices_List.map((_, i) => this.adjacencyMatrix[i][index]);
  }
}
