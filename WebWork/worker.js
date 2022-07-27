// import {SvgPlus, SvgPath, DPath, Vector} from "../SvgPlus.js"
import {DPath, Vector} from "../SvgPlus/dpath.js"
let algorithms = {
  running: {
    pattern: "g",
    run: (geo) => {
      // console.log(SVGGeometryElement);
      console.log(geo);
    }
  }
}


onmessage = function (e) {
  console.log(e);
  let name = e.data.algorithm;
  console.log(name);
  let newNode = algorithms[name].run(e.data.node);
  postMessage(newNode);
}
