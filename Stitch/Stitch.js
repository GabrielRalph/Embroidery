class Stitch{
   constructor(point){
     //Node values
     this.point = point.round();

     //Pointers
     this.next = null;
     this.last = null;
   }
   reflect(mode = 'v'){
     if (mode.indexOf('v') != -1){
       this.point.x = this.point.x*-1
     }
     if (mode.indexOf('h') != -1){
       this.point.y = this.point.y*-1
     }
   }
   set next(val){
     this._next = val;
   }

   set last(val){
     this._last = val;
   }

   get next(){
     return this._next;
   }

   get last(){
     return this._last;
   }

   clone(){
     return new Stitch(this.point)
   }

   toString(){
     let d = '';
     let cur = this
     while (cur != null){
       if (cur.last == null){
         d += `M${this.point}`
       }else{
         d += `L${cur.point}`
       }
       cur = cur.next;
     }
     return d
   }
 }
