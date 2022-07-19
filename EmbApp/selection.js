class ElementSelection {
  constructor(el){
    el.addEventListener("click", (e) => {
      this.onclick(e.target, el);
    })

    let selection = [];
    Object.defineProperty(this, "value", {
      get: () => {
        if (selection.length == 0) {
          return null;
        } else if (selection.length == 1) {
          return selection[1];
        } else {
          return [...selection];
        }
      },
      set: (value) => {
        for (let lastSelected of selection) {
          lastSelected.toggleAttribute("selected", false);
          lastSelected.selected = false;
        }

        if (value == null) return;
        try {
          if (!Array.isArray(value)) value = [value];
          else [...value]
          for (let selected of value) {
            selected.toggleAttribute("selected", true);
            selected.selected = true;
          }
          selection = value;
        } catch (e) {}
      },
    })
  }

  onclick(target, element) {
    if (!this.subtree) {
      for (let child of element.children) {
        if (target == child || child.contains(target)) {
          target = child;
          break;
        }
      }
    }

    if (target != element) {
      this.value = target;
    }
  }
}

export {ElementSelection}
