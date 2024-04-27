_ = console.info.bind(console);

function random_choice(array) {
    return array[(Math.random() * array.length) | 0];
}

function isEmpty(obj) {
   return Object.entries(obj).length === 0;
}

function timeout(ms) {
   return new Promise(resolve => setTimeout(resolve, ms));
}
