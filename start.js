"use strict";

var express = require('express');
var app = express();
var port = 17124;

app.get('/', function(req, res){
  res.send('Hallo Softwerkskammer! :-)');
});

app.listen(port);
console.log('Server running at port ' + port);

