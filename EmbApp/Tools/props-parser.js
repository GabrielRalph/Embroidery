import {Vector} from "../../SvgPlus/4.js"

const CM = 100;
const UNITS = {
  '"': 2.54 * CM,
  "'": 12 * 2.54 * CM,
  "inch": 2.54 * CM,
  "mm": 0.1 * CM,
  "cm": CM,
  "deg": Math.PI/180,
  "rad": 1,
  default: 0.1 * CM
}
class PropsParser {
  constructor(props){
    this.mainError = null;
    this.errors = {};
    this.error = false;
    for (let name in props) {
      this.errors[name] = null;
    }
  }

  error(error, name) {
    if (name in this.errors) {
      this.errors[name] = error;
    } else {
      this.mainError = error;
    }
    this.error = true;
  }

  throw() {
    if (this.error) {
      throw {
        type: "parser",
        mainError: this.mainError,
        propErrors: this.errors
      }
    }
  }

  getUnit(name) {
    return UNITS[name.toLowerCase()];
  }

  isVector(value) {
    return value instanceof Vector;
  }

  parseUnit(line){
    line = line.replace(/\s/g, "")
    let num = parseFloat(line);
    if (!Number.isNaN(num)) {
      let unit = line.replace(""+num, "");
      if (unit in UNITS) {
        num *= UNITS[unit];
      } else {
        num *= UNITS.default;
      }
    } else {
      num = null;
    }
    return num;
  }
}

export {PropsParser}
