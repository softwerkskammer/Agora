var http = require('http');
http.createServer(function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end('Hallo Softwerkskammer :-)\n');
    }).listen(171024, "127.0.0.1");
console.log('Server running at http://127.0.0.1:171024/');
