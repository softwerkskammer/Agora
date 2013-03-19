"use strict";
var http = require('http');
var ip = "127.0.0.1", port = 17124;


var swkSympaClient=require('./swkSympaClient/client');


http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var responseCallback= function (result){
        var myResponse="Hallo Softwerkskammer :-)" +
            "\n" +
            "\n" +
            "Response auf den Info Request:" +
            "\n" +
            "\n" +
            result;
        res.end(myResponse);
    }
    swkSympaClient.getInfoRequest(responseCallback);




}).listen(port, ip);
console.log('Server running at http://' + ip + ':' + port);
