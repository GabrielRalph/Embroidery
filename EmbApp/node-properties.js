import {SvgPlus, Vector} from "../SvgPlus/4.js"

class NodeProperties extends SvgPlus {
  constructor(app) {
    super("node-properties");
    this.class = "tool-box"
    this.app = app;
    this.hidden = true;
  }

  buildNodeProperties(node) {
    this.innerHTML = "";

    this.hidden = true;
    if (node != null) {
      let type = "Group";
      if (node.stype.match("spath"))  type = "Stitch Path";
      if (node.stype == "geo") type = "Geometry";
      this.createChild("div", {content: "Node Type: " + type});


      if (type != "Group") {
        let row = this.createChild("div");
        row.createChild("div", {content: "Color: "});
        row.createChild("div", {
          content: node.colorIndex,
          style: {
            "font-size": "0.8em",
            width: "1.3em",
            height: "1.3em",
            background: node.color,
            "text-align": "center",
            "line-height": "1.3em",
            "border-radius": "0.7em",
          }
        });
      }


      if (type == "Stitch Path") {
        let row = this.createChild("div");
        row.createChild("div", {
          content: "Repeats: " + node.repeats
        });
      }

      this.hidden = false;
    }
  }

  set hidden(v) {
    this.setAttribute("hidden", v)
  }


  set selectedNode(node) {
    this._selectedNode = node;
    this.buildNodeProperties(node);
  }
}

export {NodeProperties};
