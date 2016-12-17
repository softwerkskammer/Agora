'use strict';

const sponsors = require('./sponsors.json');
const R = require('ramda');

// Fisher-Yates Shuffle (see e.g. http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array)
function shuffle(array) {
  for (let i = 0; i < array.length; i++) {
    let rand = Math.floor(Math.random() * array.length);
    let tmp = array[i];
    array[i] = array[rand];
    array[rand] = tmp;
  }
  return array;
}

function composePairs() {
  return R.splitEvery(2, shuffle(sponsors)).map(
    pair => { return {first: pair[0], second: pair[1]}; }
  );
}
module.exports = composePairs;
