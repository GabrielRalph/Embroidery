function clean(text) {
  return text.replace(/^(\n|\s)+/g, "").replace(/(\n|\s)+$/g, "");
}
function param_key(text) {
  text = clean(text);
  text = text.toLowerCase(text);
  return text.replace(/\s+/g, "_");
}

const BRACKETS = {
  open: {
    "(": true,
    "{": true,
    "[": true,
  },
  close: {
    ")": true,
    "}": true,
    "]": true,
  }
}
function find_bracket_intervals(text) {
  let open = 0;
  let intvs = [];

  for (let i = 0; i < text.length; i++) {
    let newOpen = open;
    if (text[i] in BRACKETS.open){
      newOpen += 1;
    }
    if (text[i] in BRACKETS.close) {
      newOpen -= 1;
    }

    // opening
    if (newOpen == 1 && open == 0) {
      intvs.push(i);

    // closing
    } else if (newOpen == 0 && open == 1) {
      intvs.push(i + 1);
    }

    open = newOpen;

  }

  if (open < 0 || open > 0) {
    intvs = []
  }

  return intvs;
}

function isText(node) {
  return node.tagName == "text" || node.tagName == "tspan"
}
function getText(node, rflag = true) {
  let text = "";
  let remove = [];
  for (let child of node.children) {
    if (isText(child)) {
      remove.push(child);
      for (let textNode of child.childNodes) {
        if (text != "") text += '\n';
        if (textNode instanceof Text) {
          text += textNode.data;
        } else {
          text += textNode.textContent;
        }
      }
    }
  }
  if (rflag) {
    for (let child of remove) {
      child.remove();
    }
  }
  return text;
}
function getPrefill(node, rflag = true) {
  let prms = {};
  let fname = null;

  try {
    let text = getText(node, rflag);
    let intvs = find_bracket_intervals(text);

    let before = text.slice(0, intvs[0]);
    fname = clean(before.match(/[A-Za-z0-9 ]+$/)[0]).replace(" ", "");

    let params = text.slice(intvs[0] + 1, intvs[1] - 1).split(/\n|,/g);

    for (let param of params) {
      let p = clean(param);
      if (p) {
        let kv = p.split(":");
        if (kv.length >= 2) {
          let name = param_key(kv[0]);
          let value = clean(kv[1]);
          prms[name] = value;
        }
      }
    }
  } catch(e) {
  }

  let res = {name: fname, props: prms}
  if (fname == null) {
    res = null;
  }

  return res;
}

export {getPrefill}
