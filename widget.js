(function () {
  class CadVariableTestWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
      this.render();
      this.bindEvents();
      this.runTests();

      setTimeout(() => this.runTests(), 1000);
      setTimeout(() => this.runTests(), 3000);
      setTimeout(() => this.runTests(), 5000);
    }

    bindEvents() {
      const refreshBtn = this.shadowRoot.getElementById("refreshBtn");
      if (refreshBtn) {
        refreshBtn.addEventListener("click", () => this.runTests());
      }
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: Arial, sans-serif;
            padding: 16px;
            box-sizing: border-box;
            background: #f5f7fa;
            color: #1f2937;
          }

          .card {
            background: #ffffff;
            border: 1px solid #d8dee9;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          }

          .title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 6px;
          }

          .subtitle {
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 14px;
          }

          .button-row {
            display: flex;
            gap: 10px;
            margin-top: 10px;
          }

          button {
            background: #0b5cff;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 14px;
            font-weight: 700;
            cursor: pointer;
          }

          button:hover {
            opacity: 0.95;
          }

          .var-block {
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 14px;
            background: #fafafa;
          }

          .var-name {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 10px;
          }

          .row {
            margin-bottom: 8px;
          }

          .label {
            font-weight: 700;
            display: inline-block;
            min-width: 90px;
          }

          .value {
            font-family: Consolas, monospace;
            white-space: pre-wrap;
            word-break: break-word;
          }

          .ok {
            color: #067647;
            font-weight: 700;
          }

          .bad {
            color: #b42318;
            font-weight: 700;
          }

          .section-title {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 8px;
          }

          .debug-box {
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 10px;
            font-family: Consolas, monospace;
            font-size: 12px;
            white-space: pre-wrap;
            word-break: break-word;
            max-height: 280px;
            overflow: auto;
          }
        </style>

        <div class="card">
          <div class="title">CAD Variable Test Widget</div>
          <div class="subtitle">
            Testing different methods to read InteractionID and Call_Tags from Agent Desktop.
          </div>
          <div class="button-row">
            <button id="refreshBtn">Refresh Test</button>
          </div>
        </div>

        <div class="card">
          <div class="var-block">
            <div class="var-name">InteractionID</div>
            <div class="row"><span class="label">Status:</span> <span id="interaction-status"></span></div>
            <div class="row"><span class="label">Value:</span> <span class="value" id="interaction-value"></span></div>
            <div class="row"><span class="label">Method:</span> <span class="value" id="interaction-method"></span></div>
          </div>

          <div class="var-block">
            <div class="var-name">Call_Tags</div>
            <div class="row"><span class="label">Status:</span> <span id="calltags-status"></span></div>
            <div class="row"><span class="label">Value:</span> <span class="value" id="calltags-value"></span></div>
            <div class="row"><span class="label">Method:</span> <span class="value" id="calltags-method"></span></div>
          </div>
        </div>

        <div class="card">
          <div class="section-title">All Methods Tested</div>
          <div class="debug-box" id="all-tests"></div>
        </div>

        <div class="card">
          <div class="section-title">Raw this</div>
          <div class="debug-box" id="raw-this"></div>
        </div>

        <div class="card">
          <div class="section-title">Raw this.properties</div>
          <div class="debug-box" id="raw-props"></div>
        </div>

        <div class="card">
          <div class="section-title">Raw this.map</div>
          <div class="debug-box" id="raw-map"></div>
        </div>

        <div class="card">
          <div class="section-title">Raw window.$STORE / window.Store</div>
          <div class="debug-box" id="raw-store"></div>
        </div>
      `;
    }

    safeStringify(obj) {
      try {
        return JSON.stringify(
          obj,
          (key, value) => {
            if (typeof value === "function") {
              return "[Function]";
            }
            return value;
          },
          2
        );
      } catch (e) {
        return `Unable to stringify: ${e.message}`;
      }
    }

    getValueFromPath(obj, path) {
      try {
        return path.split(".").reduce((acc, key) => {
          if (acc && acc[key] !== undefined) {
            return acc[key];
          }
          return undefined;
        }, obj);
      } catch (e) {
        return undefined;
      }
    }

    findFirstValue(label, paths, sources) {
      const attempts = [];

      for (const source of sources) {
        for (const path of paths) {
          const value = this.getValueFromPath(source.obj, path);

          attempts.push({
            source: source.name,
            path,
            fullMethod: `${source.name}.${path}`,
            value: value === undefined ? "undefined" : value
          });

          if (value !== undefined && value !== null && value !== "") {
            return {
              found: true,
              label,
              value,
              method: `${source.name}.${path}`,
              attempts
            };
          }
        }
      }

      return {
        found: false,
        label,
        value: "Not found",
        method: "No matching path returned a value",
        attempts
      };
    }

    renderResult(prefix, result) {
      const statusEl = this.shadowRoot.getElementById(`${prefix}-status`);
      const valueEl = this.shadowRoot.getElementById(`${prefix}-value`);
      const methodEl = this.shadowRoot.getElementById(`${prefix}-method`);

      if (result.found) {
        statusEl.textContent = "FOUND";
        statusEl.className = "ok";
      } else {
        statusEl.textContent = "NOT FOUND";
        statusEl.className = "bad";
      }

      valueEl.textContent =
        typeof result.value === "object"
          ? this.safeStringify(result.value)
          : String(result.value);

      methodEl.textContent = result.method;
    }

    runTests() {
      const store = window.$STORE || window.Store || {};

      const sources = [
        { name: "this", obj: this || {} },
        { name: "this.properties", obj: this.properties || {} },
        { name: "this.map", obj: this.map || {} },
        { name: "$STORE", obj: store || {} }
      ];

      const interactionPaths = [
        "InteractionID",
        "interactionId",
        "interactionID",
        "contactInteractionId",
        "data.InteractionID",
        "data.interactionId",
        "variables.InteractionID",
        "variables.interactionId",
        "taskVariables.InteractionID",
        "taskVariables.interactionId",
        "contact.interactionId",
        "contact.interactionID",
        "contact.variables.InteractionID",
        "contact.variables.interactionId",
        "contact.taskVariables.InteractionID",
        "contact.taskVariables.interactionId",
        "contact.callAssociatedData.InteractionID",
        "contact.callAssociatedData.interactionId",
        "contact.cadVariables.InteractionID",
        "agentContact.interactionId",
        "agentContact.interactionID",
        "agentContact.variables.InteractionID",
        "agentContact.variables.interactionId",
        "agentContact.taskVariables.InteractionID",
        "agentContact.taskVariables.interactionId",
        "agentContact.callAssociatedData.InteractionID",
        "agentContact.callAssociatedData.interactionId",
        "agentContact.cadVariables.InteractionID"
      ];

      const callTagPaths = [
        "Call_Tags",
        "call_tags",
        "callTags",
        "data.Call_Tags",
        "variables.Call_Tags",
        "taskVariables.Call_Tags",
        "callAssociatedData.Call_Tags",
        "cadVariables.Call_Tags",
        "contact.variables.Call_Tags",
        "contact.taskVariables.Call_Tags",
        "contact.callAssociatedData.Call_Tags",
        "contact.cadVariables.Call_Tags",
        "agentContact.variables.Call_Tags",
        "agentContact.taskVariables.Call_Tags",
        "agentContact.callAssociatedData.Call_Tags",
        "agentContact.cadVariables.Call_Tags"
      ];

      const interactionResult = this.findFirstValue(
        "InteractionID",
        interactionPaths,
        sources
      );

      const callTagsResult = this.findFirstValue(
        "Call_Tags",
        callTagPaths,
        sources
      );

      this.renderResult("interaction", interactionResult);
      this.renderResult("calltags", callTagsResult);

      const allTests = {
        InteractionID: interactionResult.attempts,
        Call_Tags: callTagsResult.attempts
      };

      this.shadowRoot.getElementById("all-tests").textContent =
        this.safeStringify(allTests);

      this.shadowRoot.getElementById("raw-this").textContent =
        this.safeStringify(this);

      this.shadowRoot.getElementById("raw-props").textContent =
        this.safeStringify(this.properties || {});

      this.shadowRoot.getElementById("raw-map").textContent =
        this.safeStringify(this.map || {});

      this.shadowRoot.getElementById("raw-store").textContent =
        this.safeStringify(store || {});

      console.log("=== CAD Variable Test Widget ===");
      console.log("this", this);
      console.log("this.properties", this.properties);
      console.log("this.map", this.map);
      console.log("$STORE", store);
      console.log("InteractionID result", interactionResult);
      console.log("Call_Tags result", callTagsResult);
    }
  }

  if (!customElements.get("cad-variable-test-widget")) {
    customElements.define("cad-variable-test-widget", CadVariableTestWidget);
  }

  const mountWidget = () => {
    if (!document.querySelector("cad-variable-test-widget")) {
      const widget = document.createElement("cad-variable-test-widget");
      document.body.innerHTML = "";
      document.body.appendChild(widget);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountWidget);
  } else {
    mountWidget();
  }
})();