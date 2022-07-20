import {ElementSelection} from "../selection.js"
import {SvgPlus, Vector} from "../../SvgPlus/4.js"
import {getApplicableAlgorithms, runAlgorithm, parseProperties, getAlgorithm, isApplicable} from "./algorithms.js"

const PLAY_ICON = '<path style = "fill: var(--sfunc)" d="M50,9.35C27.55,9.35,9.35,27.55,9.35,50s18.2,40.65,40.65,40.65,40.65-18.2,40.65-40.65S72.45,9.35,50,9.35Zm21.26,46.58l-26.76,15.45c-4.57,2.64-10.28-.66-10.28-5.93v-30.89c0-5.27,5.71-8.57,10.28-5.93l26.76,15.45c4.57,2.64,4.57,9.23,0,11.87Z"/>'
const inputTypes = {
  "string": (property) => {
    let input = new SvgPlus("input");
    input.setAttribute("placeholder", property.default);
    return input;
  },
  "vector": (property) => {
    let input = SvgPlus.make("vector-selector");
    input.svg = document.querySelector("emb-app #svg-space > svg");
    input.value = property.default
    return input;
  }
}

class PropertyInput extends SvgPlus {
  constructor(property, name) {
    super("div");
    name = name.replace(/_/g, " ");
    this.createChild("div", {content: name + " :"});

    this.default = property.default;
    let input = inputTypes[property.type](property);

    this.input = input;
    this.appendChild(input);
  }

  setDefault(){
    this.value = this.default;
  }

  get value(){
    let value = this.input.value
    if (!value || value.length == 0) value = this.default;
    return value;
  }

  set value(value){
    this.input.value = value;
  }
}
class PropsForm extends SvgPlus {
  constructor() {
    super("div");
    this.class = "props-form tool-box"
    this.inputs = [];
    this.hidden = true;
  }

  set index(i){
    this.styles = {"--tool-i": i}
  }

  set algorithm(algorithm) {
    this.buildProps(algorithm);
  }
  buildProps(algorithm){
    this.hidden = true;
    this.innerHTML = "";
    if (algorithm == null) return;
    // build title
    let aname = algorithm.name.replace(/\s/g, "");
    let title = this.createChild("div");
    let run = title.createChild("div", {class: "run-btn"});
    run.createChild("div", {content: "run"})
    run.createChild("svg", {class: "icon", viewBox: "0 0 100 100", content: PLAY_ICON});
    this.runButton = run;

    // build property input
    this.inputs = {};
    let props = algorithm.properties;
    for (let name in props) {
      let property = new PropertyInput(props[name], name);
      this.appendChild(property);
      this.inputs[name] = property;
    }
    this.hidden = false;
  }

  get value() {
    let value = {};
    for (let name in this.inputs) {
      let input = this.inputs[name];
      value[name] = input.value;
    }
    return value;
  }
  set value(value) {
    for (let name in this.inputs) {
      if (name in value) {
        this.inputs[name].value = value[name]
      }
    }
  }

  // attribute toggles
  set invalid(v) {
    this._invalid = v;
    this.toggleAttribute("invalid", v);
  }
  set hidden(v) {
    this.toggleAttribute("hidden", v);
  }

  clear(){
    this.innerHTML = "";
    this.inputs = {};
    this.runButton = null;
  }
}

class AlgorithmIcon extends SvgPlus {
  constructor(node, properties, algorithm, tools, index) {
    super("div");
    this.onclick = () => {
      properties.index = index;
      properties.algorithm = algorithm;
      properties.runButton.onclick = () => {
        tools.run(node, properties.value, algorithm)
      }
    }
    let div = this.createChild("div", {content: algorithm.name});
    this.innerHTML += algorithm.icon;
  }
}

class NodeTools extends SvgPlus {
  constructor(emb) {
    super("node-tools");
    this.app = emb;
    this.innerHTML = "";
    let props = new PropsForm();
    this.propsForm = props;
    this.appendChild(props);

    let toolsList = this.createChild("div", {class: "selection-list tool-box line-gap"});
    new ElementSelection(toolsList);

    this.buildTools = (node) => {
      props.hidden = true;
      this.hidden = true;
      toolsList.innerHTML = "";
      if (node == null) return;

      let algorithms = getApplicableAlgorithms(node);
      let i = 0;
      for (let algorithm of algorithms) {
        let icon = new AlgorithmIcon(node, props, algorithm, this, i);
        toolsList.appendChild(icon);
        i++;
      }
      this.hidden = false;
    }
    this.buildTools(null);
  }

  async runPrefills() {
    for (let prefill of this.app.stree.prefills) {
      let alg = getAlgorithm(prefile.name);
      if (isApplicable(alg, prefill.node.pattern)) {
        await this.run(prefill.node, prefill.props, alg);
      }
    }
  }

  async run(node, props, algorithm) {
    let app = this.app;
    let stree = app.stree;

    app.locked = true;
    try {
      parseProperties(props, algorithm);
    } catch(error) {
      console.log(error);
    }

    let res = null;
    try {
      res = await runAlgorithm(node, props, algorithm, stree);
    } catch (es) {
      for (let e of es) {
        console.log(e.error);
      }
      res = null;
    }

    this.propsForm.clear();

    app.selected  = res;
    app.locked = false;
  }

  set selectedNode(node){
    this.buildTools(node);
  }

  set hidden(v) {
    this.toggleAttribute("hidden", v);
  }
}


export {NodeTools};
