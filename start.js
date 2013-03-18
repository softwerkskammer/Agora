"use strict";
var http = require('http');
var ip = "127.0.0.1", port = 17124;

var soap = require('soap');
var url = 'http://swk.monoceres.uberspace.de/fcgi-bin/sympa.fcgi/wsdl';
var args = {listname: 'craftsmanswap'};



http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});

    soap.createClient(url, function(err, client) {
        client.info(args, function(err, result) {
            res.end('Hallo Softwerkskammer! :-)\n');
            console.log(result);
        });
    });


}).listen(port, ip);
console.log('Server running at http://' + ip + ':' + port);
