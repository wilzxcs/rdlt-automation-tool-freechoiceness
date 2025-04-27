class RDLTUIHandler {
  constructor() {
    this.rdltInstance = new InputRDLT();
    this.currentFile = null;
    this.initialize();
  }

  initialize() {
    this.cacheElements();
    this.setupEventListeners();
  }

  cacheElements() {
    this.elements = {
      fileInput: document.getElementById("fileInput"),
      analyzeBtn: document.getElementById("analyzeBtn"),
      vertexInput: document.getElementById("vertexInput"),
      fileInfo: document.getElementById("fileInfo"),
      section: document.querySelector(".section"),
      matrixHead: document.getElementById("matrixHead"),
      matrixBody: document.getElementById("matrixBody"),
      backEdgeList: document.getElementById("backEdgeList"),
      antecedentList: document.getElementById("antecedentList"),
      consequentList: document.getElementById("consequentList"),
      posList: document.getElementById("posList")
    };

    // Create additional UI elements
    this.elements.verifyBtn = document.createElement("button");
    this.elements.verifyBtn.id = "verifyBtn";
    this.elements.verifyBtn.textContent = "Run RDLT Verification";
    this.elements.section.appendChild(this.elements.verifyBtn);
  }

  setupEventListeners() {
    this.elements.fileInput.addEventListener("change", (e) => this.handleFileLoad(e));
    this.elements.verifyBtn.addEventListener("click", () => this.handleVerification());
    this.elements.analyzeBtn.addEventListener("click", () => this.handleVertexAnalysis());
  }

  // File Handling Methods
  async handleFileLoad(event) {
    if (!event.target.files.length) return;

    this.currentFile = event.target.files[0];
    try {
      const fileContent = await this.readFile(this.currentFile);
      this.rdltInstance.readFile(fileContent);
      this.rdltInstance.evaluate();
      this.updateFileInfo();
      this.displayBasicAnalysis();
      this.clearResults();
    } catch (error) {
      this.showError(`File processing failed: ${error.message}`);
    }
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error("Error reading file"));
      reader.readAsText(file);
    });
  }

  updateFileInfo() {
    this.elements.fileInfo.textContent = `Loaded: ${this.currentFile.name}`;
  }

  // Analysis Methods
  handleVertexAnalysis() {
    if (!this.validateAnalysisPreconditions()) return;

    const vertex = this.elements.vertexInput.value.trim();
    try {
      const { antecedent, consequent } = 
        this.rdltInstance.findMaximalAntecedentAndConsequent(vertex);
      const posSet = this.rdltInstance.findAllPOS(vertex);
      
      this.displayAntecedentConsequent(antecedent, consequent);
      this.displayPOS(posSet);
    } catch (error) {
      this.showError(`Analysis failed: ${error.message}`);
    }
  }

  validateAnalysisPreconditions() {
    if (!this.currentFile) {
      alert("Please load a file first");
      return false;
    }

    const vertex = this.elements.vertexInput.value.trim();
    if (!vertex || !this.rdltInstance.getVerticesList().includes(vertex)) {
      alert(
        `Please enter a valid vertex from: ${this.rdltInstance
          .getVerticesList()
          .join(", ")}`
      );
      return false;
    }
    return true;
  }

  // Verification Methods
  handleVerification() {
    if (!this.currentFile) {
      alert("Please load a file first");
      return;
    }
  
    try {
      this.clearResults();
      this.clearExecutionTime();
  
      const startTime = performance.now();
      const phase1Results = this.runPhase1Verification();
  
      if (phase1Results.valid) {
        const phase2Results = this.runPhase2Verification(phase1Results);
        this.displayVerificationResults(phase1Results, phase2Results);
      } else {
        this.displayMessage("Phase 2 skipped: Phase 1 verification failed.");
      }
  
      this.displayExecutionTime(performance.now() - startTime);
    } catch (error) {
      this.showError(`Verification failed: ${error.message}`);
    }
  }
  

  runPhase1Verification() {
    const results = this.rdltInstance.verifyPhase1();
    this.displayPhase1Results(results);
    return results;
  }

  runPhase2Verification(phase1Results) {
    if (phase1Results.validCompositeVectors.length > 0) {
      return this.rdltInstance.verifyPhase2(phase1Results.validCompositeVectors);
    }
    this.displayMessage("Phase 2: No valid composite vectors found. RDLT is not Σ-distinct PCS.");
    return null;
  }

  // Display Methods
  displayBasicAnalysis() {
    this.displayMatrix(
      this.rdltInstance.getAdjacencyMatrix(),
      this.rdltInstance.getVerticesList()
    );
    this.displayBackEdges(this.rdltInstance.getBackEdges());
  }

  displayMatrix(matrix, vertices) {
    this.elements.matrixHead.innerHTML = `<tr><th></th>${vertices
      .map((v) => `<th>${v}</th>`)
      .join("")}</tr>`;
      
    this.elements.matrixBody.innerHTML = matrix
      .map(
        (row, i) =>
          `<tr><th>${vertices[i]}</th>${row
            .map((cell) => `<td>${cell}</td>`)
            .join("")}</tr>`
      )
      .join("");
  }

  displayBackEdges(backEdges) {
    this.elements.backEdgeList.innerHTML = backEdges
      .map((edge) => `<li>${edge}</li>`)
      .join("");
  }

  displayAntecedentConsequent(antecedent, consequent) {
    this.elements.antecedentList.innerHTML =
      antecedent.map((v) => `<li>${v}</li>`).join("") ||
      "<li>No antecedent vertices found</li>";
      
    this.elements.consequentList.innerHTML =
      consequent.map((v) => `<li>${v}</li>`).join("") ||
      "<li>No consequent vertices found</li>";
  }

  displayPOS(posSet) {
    this.elements.posList.innerHTML =
      posSet.map((v) => `<li>${v}</li>`).join("") ||
      "<li>No POS vertices found</li>";
  }

  displayPhase1Results(results) {
    const container = this.getResultsContainer("phase1Results");
    container.innerHTML = `<h2>Phase 1: Composite Vector Verification</h2>`;

    // Display validation summary
    const summaryDiv = document.createElement("div");
    summaryDiv.className = results.valid ? "valid-result" : "invalid-result";
    summaryDiv.innerHTML = `
      <p><strong>Status:</strong> ${
        results.valid ? "Constraints are valid. Proceeding to Phase 2." : "Constraints are invalid. RDLT is not Σ-distinct PCS."
      }</p>
      <p><strong>Valid Vectors:</strong> ${
        results.validCompositeVectors.length
      }</p>
      <p><strong>Retained Vertices:</strong> ${
        results.retainedVertices.join(", ") || "None"
      }</p>
    `;
    container.appendChild(summaryDiv);

    // Display valid vectors
    if (results.validCompositeVectors.length > 0) {
      const vectorsDiv = document.createElement("div");
      vectorsDiv.className = "valid-vectors";

      results.validCompositeVectors.forEach((vector) => {
        const vectorDiv = document.createElement("div");
        vectorDiv.className = "valid-vector";
        vectorDiv.innerHTML = `<p><strong>${vector.name}</strong>: [${vector.parents.join(", ")}]</p>`;
        vectorsDiv.appendChild(vectorDiv);
      });
      container.appendChild(vectorsDiv);
    }

    // Display issues if any
    if (results.issues.length > 0) {
      const issuesDiv = document.createElement("div");
      issuesDiv.className = "issues";
      issuesDiv.innerHTML = "<h3>Validation Issues:</h3>";

      const issuesList = document.createElement("ul");
      results.issues.forEach((issue) => {
        const item = document.createElement("li");
        item.textContent = issue.message;
        issuesList.appendChild(item);
      });

      issuesDiv.appendChild(issuesList);
      container.appendChild(issuesDiv);
    }
  }

  displayVerificationResults(phase1Results, phase2Results) {
    if (phase2Results) {
      this.displayPhase2Results(phase2Results);
    }
  }

  displayPhase2Results(results) {
    const container = this.getResultsContainer("phase2Results");
    container.innerHTML = `<h2>Phase 2: Σ-distinct PCS Verification</h2>`;

    const statusDiv = document.createElement("div");
    statusDiv.className = results.isValid ? "valid-result" : "invalid-result";
    statusDiv.innerHTML = `<p><strong>Status:</strong> ${results.message}</p>`;
    container.appendChild(statusDiv);

    if (!results.isValid && results.violations.length > 0) {
      const violationsDiv = document.createElement("div");
      violationsDiv.className = "violations";
      violationsDiv.innerHTML = "<h3>Constraint Violations:</h3>";

      results.violations.forEach((violation) => {
        const violationDiv = document.createElement("div");
        violationDiv.className = "violation";
        violationDiv.innerHTML = `
          <p><strong>Sibling Group:</strong> ${violation.siblingGroup.join(", ")}</p>
          <p><strong>Vertex:</strong> ${violation.vertex}</p>
          <p><strong>Missing in Antecedent:</strong> ${violation.missingInAntecedent}</p>
          <p><strong>Required POS:</strong> ${violation.posAll.join(", ")}</p>
          <p><strong>Antecedent Set:</strong> ${violation.antecedent.join(", ")}</p>
        `;
        violationsDiv.appendChild(violationDiv);
      });

      container.appendChild(violationsDiv);
    }
  }

  // Utility Methods
  getResultsContainer(id) {
    let container = document.getElementById(id);
    if (!container) {
      container = document.createElement("div");
      container.id = id;
      container.className = "results-container";
      this.elements.section.appendChild(container);
    }
    return container;
  }

  clearResults() {
    ["phase1Results", "phase2Results"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = "";
    });
  }

  displayExecutionTime(time) {
    const timeDiv = document.createElement("div");
    timeDiv.className = "execution-time";
    timeDiv.innerHTML = `<p><strong>Total Execution Time:</strong> ${time.toFixed(2)} ms</p>`;
    this.elements.section.appendChild(timeDiv);
  }
  clearExecutionTime() {
    const existing = document.querySelector(".execution-time");
    if (existing) existing.remove();
  }

  displayMessage(message) {
    const msgDiv = document.createElement("div");
    msgDiv.className = "info-message";
    msgDiv.textContent = message;
    this.elements.section.appendChild(msgDiv);
  }

  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error";
    errorDiv.textContent = message;
    this.elements.section.appendChild(errorDiv);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new RDLTUIHandler();
});