"use strict";
var http = require('http');
var ip = "127.0.0.1", port = 17124;

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hallo Softwerkskammer! :-)\n');
}).listen(port, ip);
console.log('Server running at http://' + ip + ':' + port);
