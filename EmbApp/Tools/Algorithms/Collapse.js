
const name = "Collapse";
const properties = null;
const pattern = /^\(.*\)$/;

const icon = `
<svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 93.87 51.76"><defs><style>.cls-1{fill:#fff;}.cls-2{fill:#ffd400;}.cls-3{stroke-width:2px;}.cls-3,.cls-4{fill:none;stroke:#fff;stroke-miterlimit:10;}.cls-4{stroke-width:4px;}</style></defs><g><circle class="cls-1" cx="60.13" cy="41.14" r="6.84"/><circle class="cls-1" cx="82.65" cy="41.14" r="6.84"/><circle class="cls-1" cx="37.61" cy="41.14" r="6.84"/></g><path class="cls-3" d="M60.13,13.67c-.56,8.02,.64,15.73,0,21.62"/><path class="cls-3" d="M37.61,35.3c0-8.22,22.52-14.4,22.52-22.62"/><path class="cls-3" d="M82.65,35.3c0-8.22-22.52-14.4-22.52-22.62"/><g><line class="cls-4" x1="19.51" y1="27.23" x2="19.51" y2="6.39"/><polyline class="cls-4" points="27.96 19.51 19.51 4.87 11.06 19.51"/></g><rect class="cls-3" x="1" y="31.51" width="91.87" height="19.26" rx="9.63" ry="9.63"/><circle class="cls-2" cx="60.13" cy="6.84" r="6.84"/></svg>

`

function run(params){
  let group = params.input;
  let output = params.output;

  let newChildren = [];
  let parent = group.parentNode;
  let pased = false;
  for (let child of parent.children) {
    if (child == group) {
      for (let child of group.children) {
        newChildren.push(child);
      }
    } else {
      newChildren.push(child);
    }
  }
  group.remove();
  for (let child of newChildren) {
    parent.appendChild(child);
  }
  return null
}

export {name, properties, run, pattern, icon}
