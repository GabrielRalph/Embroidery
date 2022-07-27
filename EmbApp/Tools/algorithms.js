import {PropsParser} from "./props-parser.js"

let ALGS = [
  "RunningStitch",
  "SatinColumn",
  "PointToPoint",
  "Collapse",
  "LoopJoin",
  "ExportDST",
  "Sequence",
  "Repeat",
]

let NodeAlgorithms = null;
let ByNames = {};
async function getAlgorithms(){
  NodeAlgorithms = new Set();
  for (let key of ALGS) {
    let alg = await import(`./Algorithms/${key}.js`);
    NodeAlgorithms.add(alg);
    ByNames[key] = alg;
  }
}
getAlgorithms();

function toRegexp(algorithm) {
  let reg = algorithm.pattern;
  if (typeof reg === "string"){
    reg = reg.replace("(", "\\(");
    reg = reg.replace(")", "\\)");
    reg = reg.replace("[", "\\[");
    reg = reg.replace("]", "\\]");
    reg = new RegExp(reg);
  }
  return reg;
}

function isApplicable(algorithm, pattern) {
  let reg = toRegexp(algorithm);
  let match = pattern.match(reg);
  return match && match[0] == pattern;
}

function containsApplicable(algorithm, pattern) {
  let reg = toRegexp(algorithm);
  let match = pattern.match(reg);
  return !!match;
}

function getApplicableNodes(algorithm, root) {
  let applicable = [];
  if (isApplicable(algorithm, root.pattern)) {
    applicable.push(root);
  } else if (containsApplicable(algorithm, root.pattern)) {
    // console.log(root.chi);
    if (root.children.length == 0) {
      applicable.push(root);
    } else {
      for (let child of bfs(root)) {
        if (isApplicable(algorithm, child.pattern)) {
          applicable.push(child);
        }
      }
    }
  }

  return applicable;
}

function bfs(root) {
  let que = [root];
  let pre = [];
  while (que.length > 0) {
    let node = que.shift();
    pre.unshift(node);
    for (let child of node.children) {
      que.push(child);
    }
  }
  return pre;
}

function getApplicableAlgorithms(root) {
  let applicable = new Set();
  let patterns = new Set();
  if (root) {
    let pattern = root.pattern;
    for (let algorithm of NodeAlgorithms) {
      if (isApplicable(algorithm, pattern) || containsApplicable(algorithm, pattern)) {
        applicable.add(algorithm);
      }
    }
  }

  return applicable;
}

function getAlgorithm(name) {
  return ByNames[name];
}


/* run, finds all nodes rooted at a given node */
async function runAlgorithm(root, props, algorithm, stree){
  let select = root;

  let applicable = getApplicableNodes(algorithm, root);

  console.log(applicable);

  let parallelTasks = [];
  let errors = []
  for (let node of applicable) {
    try {
      let task = runAlgorithmInstance(node, props, algorithm, stree);
      task.input = node;
      if (node == root) {
        task.replace = node;
      }
      parallelTasks.push(task);
    } catch (e) {
      errors.push({
        node: node,
        error: e,
      })
    }
  }

  for (let task of parallelTasks) {
    try {
      let result = await task;
      if (task.replace) select = result;
    } catch (e) {
      errors.push({
        node: task.input,
        error: e,
      })
    }
  }

  if (errors.length > 0) {
    throw errors
  }

  return select;
}

async function nextFrame() {
  return new Promise(function(resolve, reject) {
    window.requestAnimationFrame(resolve);
  });
}
async function runAlgorithmInstance(inNode, props, algorithm, stree) {
  // create parameters
  let gout = stree.makeOuput();
  let output = gout.makeGroup();
  let params = {
    input: inNode,
    props: props,
    output: output,
    guides: gout.makeGroup(),
  }

  let error = false;
  try {
    // run algorithm and get itterator
    let it = algorithm.run(params);

    // if algorithm returns an itterator, then itterate at frame rate
    if (it != null) {
      const rate = 2;
      let i = 0;
      for (let progress of it) {
        if (i % rate == 0) await nextFrame();
        inNode.progress = progress;
        i++;
      }
    }
  } catch(e) {
    error = e;
  }
  inNode.progress = 0;
  inNode.working = false;

  let outNode = null;
  if (!error && output.children.length > 0) {
    let frag = output.children.length > 1;
    if (frag) {
      let outNode = new DocumentFragment();
      for (let child of output.children) {
        outNode.append(child);
      }
    } else {
      outNode = output.children[0]
    }

    // replace root case
    if (inNode == stree.root) {
      if (frag) {
        let g = new Group();
        g.appendChild(outNode);
        outNode = g;
      }
      stree.root = outNode;
    }
    inNode.replace(outNode);
  }

  //remove output
  gout.remove();
  stree.update();

  if (error) {
    throw error;
  }
  return outNode;
}

function parseProperties(props, algorithm){
  if (algorithm.parseProperties instanceof Function) {
    algorithm.parseProperties(props, new PropsParser);
  }
}

export {getApplicableAlgorithms, isApplicable, containsApplicable,
        getApplicableNodes, getAlgorithm, getAlgorithms,
        parseProperties, runAlgorithm}
