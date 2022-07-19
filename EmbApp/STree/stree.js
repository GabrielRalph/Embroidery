import {Geometry, Group, SPath} from "./stitch-nodes.js";
import {getPrefill} from "./get-prefill.js"

const DEBUG = {
  "update": false,
}

function debug(id, str) {if (DEBUG[id]) console.log(str);}

function isGeo(node) {
  return node instanceof SVGGeometryElement;
}
function isGroup(node) {
  return node instanceof SVGGElement;
}


const PATTERN_IDS = {
  "group": ["(", ")"],
  "sgroup": ["[", "]"],
  "spath": "s",
  "geo": "g",
  "geo-fill": "f",
  "spath-loop": "l"
}


function reduceTree(root) {
  debug("update", "\treducing stree");
  let reduce = (node, sfunc = null) => {
    if (isGroup(node)) {
      // remove groups with no children, sfunction to parent
      if (node.children.length == 0) {
        node.remove();

      // collapse groups with one child, sfunction to child
      } else if (node.children.length == 1) {
        let child = node.children[0];
        node.parentNode.replaceChild(child, node);
        if (node == root) {
          root = child;
        }
        // reduce the child
        reduce(child, sfunc);

      // otherwise recursively reduce children
      } else {
        if (node.children.length > 5) node.collapsed = true;
        for (let child of node.children) {
          reduce(child, sfunc);
        }
      }
    }
  }
  reduce(root);
  return root;
}
function constructNodes(root) {
  debug("update", "\tconstructing stree");
  let prefills = [];
  let construct = (node) => {
    if (isGroup(node)) {
      if (!Group.is(node)) {
        new Group(node);
      }

      // get and remove text function instructions
      let prefill = getPrefill(node);
      if (prefill != null) {
        prefills.push([node, prefill]);
      }

      // recurse on all children
      for (let child of node.children) {
        construct(child);
      }
    } else if (!isGeo(node)) {
      node.remove();
    } else {
      if (!Geometry.is(node) && !SPath.is(node)) {
        if (node.classList.contains("spath") && node.tagName == "path") {
          new SPath(node);
        } else {
          new Geometry(node);
        }
      }
    }
  }
  construct(root);
  return prefills;
}
function updateColoring(root) {
  debug("update", "\tupdating stree coloring");
  let cc = 1;
  let colors = {};
  let colored = [];

  let recurse = (node) => {
    if (isGroup(node)) {
      for (let child of node.children)
        recurse(child);
    } else {
      let color = node.color;
      if(!(color in colors)) {
        colors[color] = cc;
        cc++;
      }
      colored.push(node);
    }
  }
  recurse(root);

  for (let node of colored) {
    node.colorIndex = colors[node.color]
  }
}
function updatePattern(root){
  debug("update", "\tupdating stree node patterns");
  let getPattern = (node) => {
    let pattern = PATTERN_IDS[node.stype];
    if (node.tagName === "g") {
      let subpat = "";
      for (let child of node.children) {
        subpat += getPattern(child);
      }
      pattern = pattern[0] + subpat + pattern[1];
    }

    if (node == root) pattern = "r" + pattern;

    node.pattern = pattern;
    return pattern;
  }
  getPattern(root);
}

function getSTreeRoot(svg) {
  let root = null;
  for (let child of svg.children) {
    if (isGroup(child)) {
      root = child;
      let id = child.getAttribute("id");

      if (typeof id === "string" && id.indexOf("STree") != -1) {
        break;
      }
    }
  }
  return root;
}


class STree {
  constructor(rootDir, visualizer, outputDir = rootDir) {
    this.rootDir = rootDir;
    this.outputDir = outputDir;
    this.root = getSTreeRoot(rootDir);

    this.visualize = async () => {
      await visualizer.update(350, this.root);
    }

    this.update();
  }

  makeOuput(){return this.outputDir.createChild(Group)}

  async runPrefills() {
    while (this.prefills.length > 0) {
      let [node, func] = this.prefills.shift();
      let algorithm = getAlgorithm(func.name);
      let props = func.props;
      if (algorithm) {
        try {
          this.parseProps(props, algorithm);
          await this.run(node, props, algorithm);
        } catch (e) {
          console.log(e);
        }
      }
    }
  }

  async update(){
    debug("update", "updating stree");
    this.prefills = constructNodes(this.root);
    this.root = reduceTree(this.root);
    updateColoring(this.root);
    updatePattern(this.root);

    await this.visualize();
    debug("update", "updated");
  }

  set root(root) {
    this._root = root;
  }
  get root(){
    return this._root;
  }
}

export {STree}
