import {ElementSelection} from "./selection.js"
import {SvgPlus, Vector} from "../SvgPlus/4.js"
import {VisualTree} from "../VisualTree/visual-tree.js";
import {SvgPro} from "./svg-pro.js"

import {NodeTools} from "./Tools/node-tools.js"
import {NodeProperties} from "./node-properties.js"

import {STree} from "./STree/stree.js"


function parseSVGString(string){
  let parser = new DOMParser()
  let doc = parser.parseFromString(string, "image/svg+xml");
  let errors = doc.getElementsByTagName('parsererror');


  if (errors && errors.length > 0){
    // throw '' + new PlusError(`${errors[0]}`)
    return null
  }
  return doc.querySelector("svg");
}

async function loadSVG(url){
  let svgString = await fetch(url);
  svgString = await svgString.text();
  let svg = parseSVGString(svgString);
  return svg;
}

async function openSVG(){
  let input = new SvgPlus("input");
  input.props = {
    type: "file",
    accept: ".svg",
    style: {display: "none"}
  }
  return new Promise((resolve, reject) => {
    let fileReader = new FileReader();
    let name = "";
    fileReader.onload = (text) => {
      let svg = parseSVGString(fileReader.result);
      resolve([svg, name]);
    }
    input.oninput = () => {
      let svgFile = input.files[0];
      name = svgFile.name.split(".")[0];
      fileReader.readAsText(svgFile);
    }
    input.click();
  });
}

async function delay(t){return new Promise((resolve, reject) => {
  setTimeout(resolve, t);
});}

class EmbApp extends SvgPlus {
  constructor(el) {
    super(el);
    this._selection = [];
  }
  onconnect() {
    this.innerHTML = "";
    let toolAnchor = this.createChild("div", {class: "tools-anchor"})
    let tools = toolAnchor.createChild("div", {class: "tools-menu"});
    this.svgSpace = this.createChild("div", {id: "svg-space"});

    this.visualTree = SvgPlus.make("visual-tree");
    tools.appendChild(this.visualTree);
    this.visualTree.svg.props = {preserveAspectRatio: "xMaxYMid meet"};
    let selection = new ElementSelection(this.visualTree.nodes);
    this.visualTree.addEventListener("select", (e) => {
      this.selected = e.value;
    })

    this.nodeTools = new NodeTools(this);
    tools.appendChild(this.nodeTools);

    this.nodeProperties = new NodeProperties(this);
    tools.appendChild(this.nodeProperties);

    this.errors = tools.createChild("pre", {class: "errors"})
    this.onclick = (e) => {
      // console.log( e.dragged);
      if (this.svgSpace.contains(e.target) && !e.dragged) {
        selection.value = null;
        this.selected = null;
      }
    }

  }


  // file functions
  async open(){
    let [svg, name] = await openSVG();
    this.svg = svg;
    this.name = name;
  }
  async load(url){
    this.svg = await loadSVG(url);
  }
  save(name = this.name){
    this.svg.saveSvg(name)
  }

  // node functions
  set selected(node){
    this.svg.frame(node);
    this.nodeProperties.selectedNode = node;
    this.nodeTools.selectedNode = node;
  }

  // private
  set locked(v) {
    this.toggleAttribute("locked", !!v);
    this._locked = v;
  }
  get locked(){
    return this._locked;
  }

  set svg(svg) {
    this.toggleAttribute("stree", false);
    if (svg != null) {
      svg = new SvgPro(svg);
      this.svgSpace.innerHTML = "";
      this.svgSpace.appendChild(svg);
      this.stree = new STree(svg.original, this.visualTree, svg.foreground);
      this.toggleAttribute("stree", true);
    }
    this._svg = svg;
  }
  get svg(){return this._svg}
}

SvgPlus.defineHTMLElement(EmbApp);
