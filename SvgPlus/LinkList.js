//LinkItem
class LinkItem{
  constructor(){
    this.last = null;
    this.next = null;
  }


  //Link this item to another item
  // <this> <=> <l2>
  link(l2){
    if (l2 instanceof LinkItem){
      this.next = l2;
      l2.last = this
    }
  }

//  Disconect an item
//  PARAMS: dir (
//    both: disconects both the previous node and the next
//    next: disconect the next node
//    last: disconect the last node
//  )
  break(dir = 'both'){
    if (dir === 'next'){
      if (this.next != null){
        this.next.last = null;
        this.next = null;
      }
    }else if (dir === 'last'){
      if (this.last != null){
        this.last.next = null;
        this.last = null;
      }
    }else if(dir === 'both'){
      if (this.last != null){
        this.last.next = null;
        this.last = null;
      }
      if (this.next != null){
        this.next.last = null;
        this.next = null;
      }
    }
  }
}

//LinkList
class LinkList{
  constructor(){
    this.start = null;
    this.end = null;
    this.length = 0;
  }
  clear(){
    this.start = null;
    this.end = null;
  }

  // Connect an item or list to the end of this list
  push(item){
    if (item instanceof LinkItem){
      if (this.contains(item)){
        throw `Error pushing to linked list:\nCannot push an item contained in this list, remove the item first\nLIST'S SHOULD NOT CONTAIN OTHER LISTS ITEMS`
        return
      }

      this.length++;

      //if the node was unset <start> => item <= <end>
      if (this.end == null || this.start == null){
        this.start = item; // <start> => item
        this.end = item;   // <end> => end

      //Otherwise end refers to <end> <=> <item>
      //                        <end> => <item>
      }else{
        this.end.link(item)
        this.end = item;
      }
    }else if(item instanceof LinkList){
      if (this.contains(item)){
        throw `Error pushing to linked list:\nCannot push a list that contains an items in this list\nLIST'S SHOULD NOT CONTAIN OTHER LISTS ITEMS`
        return
      }

      this.length += item.length
      //if node not set <start> => <item.start>  <item.end> <= <end>
      if (this.end == null || this.start == null){
        this.start = item.start;
        this.end = item.end;

      //Else      <end> <=> item
      //          item <= <end>
      }else{
        this.end.link(item.start)
        this.end = item.end;
      }
    }else{
      throw `Error pushing to linked list:\nThe item given is not a LinkList or LinkItem`
    }
  }

  // Connect an item or list to the start of this list
  queue(item){
    if (item instanceof LinkItem){
      if (this.contains(item)){
        throw `Error queueing to linked list:\nCannot queue an item contained in this list, remove the item first`
        return
      }

      this.length ++;

      //not set:  <start> => item <= <end>
      if (this.end == null || this.start == null){
        this.start = item;
        this.end = item;

        // else: <item> <=> <start> | <start> => <item>
      }else{
        item.link(this.start)
        this.start = item;
      }


    }else if(item instanceof LinkList){
      if (this.contains(item)){
        throw `Error queueing to linked list:\nCannot queue a list that contains items in this list`
        return
      }

      this.length += item.length;

      // <start> => item <= <end>
      if (this.start == null){
        this.start = item.start;
        this.end = item.end;

        // item <=> <start> | <start> => item
      }else{
        item.end.link(start)
        this.start = item.start;
      }
    }else{
      throw `Error queueing to linked list:\nThe item given is not a LinkList or LinkItem`
    }
  }

  // Remove a linked item from the end of the list
  pop(){
    if (this.end == null || this.start == null){
      return null
    }else if (this.end == this.start){
      let end = this.end;
      thid.end = null;
      this.start = null;
      return end;
    }else{
      let oldl = this.end;
      let newl = this.end.last;
      oldl.break();
      this.end = newl;
      return oldl
    }
  }

  // Remove a linked item from the start of the list
  dequeue(){
    if (this.end == null || this.start == null){
      return null
    }else if (this.end == this.start){
      let start = this.start
      thid.end = null;
      this.start = null;
      return start;
    }else{
      let oldl = this.start;
      let newl = this.start.next;
      oldl.break();
      this.start = newl;
      return oldl
    }
  }

  // Remove an item
  remove(item){
    if (item instanceof LinkItem){
      if (this.contains(item)){
        if (item.last == null || item == this.start){
          this.dequeue()
        }else if(item.next == null || item == this.end){
          this.pop()
        }else{
          this.length --;
          let last = item.last;
          let next = item.next;
          item.break();
          last.link(next);
          return item
        }
      }else{
        throw `Error removing an item:\nItem given is not contained in this list`
        return null
      }
    }else{
      throw `Error removing an item:\nItem given is not a LinkItem`
      return null
    }
  }

  // Visit each node and call the visit function visit(item, i)
  forEach(visit){
    if (visit instanceof Function){

      if (this.end == null || this.start == null){
        return
      }else if(this.end == this.start){
        visit(this.end);
      }else{
        let cur = this.start;
        let i = 0;
        visit(cur, i);
        while ( cur != this.end && cur != null){
          cur = cur.next;
          i++;
          visit(cur, i);
        }
      }
    }else{
      throw `Error calling forEach:\n${visit} is not a Function`
    }
  }

  // Check if an item is inside this LinkList
  contains(item){
    if (item instanceof LinkItem){
      let contains = false;
      this.forEach((node) => {
        contains |= (node === item)
      })
      return contains
    }else if(item instanceof LinkList){
      let contains = false;
      item.forEach((node) => {
        contains |= this.contains(node)
      })
      return contains
    }else{
      throw `Error calling contains:\nThe item given is not a LinkItem`
      return false
    }
  }

  // Connect a LinkList or LinkItem after given location
  putAfter(item, location){
    if (item instanceof LinkItem || item instanceof LinkList){
      if (this.contains(location)){
        if (location.next == null || location == this.end){
          this.push(item)
        }else if(location.last == null || location == this.start){
          this.queue(item)
        }else{
          if (this.contains(item)){
            throw `Error calling putAfter:\nCannot put an item contained inside this list`
            return
          }
          if (item instanceof LinkItem){
            this.length++;
            let next = location.next;
            location.link(item);
            item.link(next);
          }else{
            this.length += item.length;
            let next = location.next;
            location.link(item.start);
            item.end.link(next);
          }
        }
      }else{
        throw `Error calling putAfter:\nThe location is not in the linked list`
      }
    }else{
      throw `Error calling putAfter:\nThe item given is not a LinkList or LinkItem`
    }
  }

  // Connect the end and start
  // <end> next <=> last <start>
  set loop(val = false){
    if (typeof val === 'boolean'){
      if (val) {
        if (!(this.end == null || this.start == null)){
          this.end.link(this.start);
        }
      }else{
        if (this.end == null || this.start == null){
          this.end.break('next')
        }
      }
      this._loop = true;
    }else{
      throw `Error setting loop:\nLoop can be either set true or false`
    }
  }
  get loop(){
    return this._loop
  }

  rotate(x = 1){
    if (typeof x !== 'number'){
      throw `Error rotating list:\nrotate takes a number`
      return
    }else if ((this.end == this.start) || (this.end == null || this.start == null)){
      return
    }

    let old_loop = this.loop;
    let dir = (x > 0);
    x = Math.abs(x);
    this.loop = true;

    while (x > 0){
      if (dir){
        this.end = this.end.next;
        this.start = this.start.next;
      }else{
        this.end = this.end.last;
        this.start = this.start.last;
      }
      x--;
    }

    this.loop = old_loop;
  }
}
