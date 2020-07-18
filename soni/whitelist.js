let whitelist = {
  class: () => {return true},
  style: () => {return true},
  src: (value) => {
    let valid = 'https://static.planetminecraft.com/';
    let soln = true;
    for (var i = 0; i < valid.length; i++){
      soln &= valid[i] == value[i]
    }
    return soln
  }
}
