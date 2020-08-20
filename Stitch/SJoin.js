class SJoin extends SNode{
  constructor(sTree){
    super(sTree)

    this.toolBox = sTree.toolBox;
    this.edit = false;

    this.onclick = () => {
      this.defaultClickHandler()
    }
  }

  computeAll(callback){
    this.children.forEach((child) => {
      if (child instanceof SPath){
        child.compute(callback)
      }else if(child instanceof SJoin){
        child.computeAll(callback)
      }
    });
  }


  defaultClickHandler(){
    if(!this.edit){
      //Promt Join
      if (this.isComputed()){
        this.toolBox.show('join-mode');
        let insert = document.createElement('div')
        insert.innerHTML = 'insert'
        insert.onclick = () => {
          this.edit = true;
          let friend = new LoopInsert(this)
          friend.ondone = () => {
            setTimeout(() => {
              this.edit = false;
              this.onclick = () => {
                this.defaultClickHandler()
              }
            }, 50)
          }
        }
        let move = document.createElement('div')
        move.innerHTML = 'move'

        let download = document.createElement('div')
        download.innerHTML = 'download'
        download.onclick = () => {
          let exp = new DSTExporter();
          exp.addSNode(this)
          let url = exp.downloadURL()
          this.toolBox.show('download', {url: url})
        }

        this.toolBox.tool.appendChild(download)
        this.toolBox.tool.appendChild(insert)
        this.toolBox.tool.appendChild(move)

        //Compute all nodes
      }else{
        this.computeAll()
      }
    }
  }

  isMoveGroup(){
    this.children.forEach((child) => {
      if (child instanceof SJoin){
        return false
      }
    });
    return true
  }

  isComputed(){
    let res = true;
    this.children.forEach((child) => {
      if (child instanceof SPath){
        res &= (child.mode == 'computed');
      }else if (child instanceof SJoin){
        res &= child.isComputed()
      }
    });
    return res
  }

}
