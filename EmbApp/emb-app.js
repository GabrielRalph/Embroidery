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

class FileMenu extends SvgPlus {
  constructor(app) {
    super("div");
    this.class = "file-menu";

    let fileIcon = this.createChild("div", {class: "file-icon"});
    fileIcon.createChild("div", {content: "file"})
    let fileList = this.createChild("div", {class: "tool-box"});
    let open = fileList.createChild("div", {content: "open"});
    let save = fileList.createChild("div", {class: "only-stree", content: "save"});
    let saveSel = fileList.createChild("div", {class: "only-selection", content: "save selection"});

    this.fileList = fileList;
    this.listHidden = true;

    this.onclick = () => {app.selected = null}

    this.over = false;
    this.addEventListener("mouseover", () => {
      this.over = true;
    });
    this.addEventListener("mouseleave", () => {
      this.over = false;
    })

    fileIcon.onclick = () => {
      if (this.listHidden) {
        this.show();
      } else {
        this.listHidden = true;
      }
    }

    open.onclick = () => {app.open()}
  }

  show(){
    if (!this.listHidden) return;
    this.listHidden = false;
    let wait = () => {
      setTimeout(() => {
        if (this.over && !this.listHidden) {
          wait();
        } else {
          this.listHidden = true;
        }
      }, 1000);
    }
    wait();
  }

  set listHidden(v){
    console.log(v);
    this.fileList.toggleAttribute("hidden", v)
    this._listHidden = v;
  }
  get listHidden(){return this._listHidden;}
}

class EmbApp extends SvgPlus {
  constructor(el) {
    super(el);
    this._selection = [];
  }
  onconnect() {
    this.innerHTML = "";
    this.appendChild(new FileMenu(this));

    let toolAnchor = this.createChild("div", {class: "tools-anchor"})
    let tools = toolAnchor.createChild("div", {class: "tools-menu"});
    this.svgSpace = this.createChild("div", {id: "svg-space"});

    this.visualTree = SvgPlus.make("visual-tree");
    tools.appendChild(this.visualTree);
    this.visualTree.svg.props = {preserveAspectRatio: "xMaxYMid meet"};
    this.nodeSelection = new ElementSelection(this.visualTree.nodes);
    this.visualTree.addEventListener("select", (e) => {
      this.selected = e.value;
    })

    this.nodeTools = new NodeTools(this);
    tools.appendChild(this.nodeTools);

    this.nodeProperties = new NodeProperties(this);
    tools.appendChild(this.nodeProperties);

    this.errors = tools.createChild("pre", {class: "errors"})
    this.onclick = (e) => {
      if (this.svgSpace.contains(e.target) && !e.dragged) {
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
    this.toggleAttribute("selection", node != null);
    if (this.svg) {
      this.svg.frame(node);
    }
    let vnode = node ? node.vnode : null;
    this.nodeSelection.value = vnode;
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
    this.selected = null;
    this.toggleAttribute("stree", false);
    console.log("setting svg");
    if (svg != null) {
      svg = new SvgPro(svg);
      console.log("svg-pro made");
      this.svgSpace.innerHTML = "";
      this.svgSpace.appendChild(svg);
      console.log("parsing stree");
      this.stree = new STree(svg.original, this.visualTree, svg.foreground);
      console.log("parsed");

      this.toggleAttribute("stree", true);
    }
    this._svg = svg;
  }
  get svg(){return this._svg}
}

SvgPlus.defineHTMLElement(EmbApp);
