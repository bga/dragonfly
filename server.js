(function($G) {
	var sys = require('sys'),
		http = require('http'),
		https = require('https'),
		fs = require('fs'),
		path = require('path'),
		Script = require('vm')//process.binding('evals').Script
	;

	const hostName = "bga-test.com"
	const httpPort = 39080;
	const httpsPort = 39443;
	const httpsKeyPemFilePath = path.join(__dirname, "key.pem");
	const httpsCertFilePath = path.join(__dirname, "cert.pem");


	var extToMimeMap = {
		'.txt': 'text/plain',
		'.js': 'text/javascript',
		'.css': 'text/css',
		'.html': 'text/html',
		'.htm': 'text/html',
		'.wav': 'audio/wav',
		'.svg': 'image/svg+xml',
		'.ogg': 'application/ogg',
		'.jar': 'application/java-archive',
		'.ico': 'image/x-icon',
		'.mht': 'multipart/related',
		'.xml': 'application/xhtml+xml'
		//'.ogg': 'audio/ogg'
	};

	var Url_getExt = function(url) {
		var begin = 0, end = url.length, point, i;

		if((i = url.lastIndexOf('#', end)) > 0) { 
			end = i; 
		};

		if((i = url.lastIndexOf('?', end)) > 0) { 
			end = i; 
		};

		if((i = url.lastIndexOf('.', end)) < 0) { 
			return null; 
		};

		point = i;

		if((i = url.lastIndexOf('/', end)) > -1) { 
			begin = i; 
		};

		if(begin >= point) { 
			return null; 
		};

		return url.substring(point, end);
	};

	var log = $G.log = function() {
		sys.puts.apply(sys, arguments);
	};

	var User_isDynamicUrl = function(url) {
		return url.indexOf('.app.js') > -1;
	};
	var Url_isFolder = function(url) {
		return url.match(/\/$/)
	}

	String.prototype.urlToFsPath = function() {
		return path.join(__dirname, this.valueOf())
	}

	var Server_onRequest = function (req, res) {
		var url = unescape(req.url);

		log(url);

		var fileUrl = path.join(__dirname, url.slice(1))


		//url = ('.' + url).replace(/\/(?:\?|#|$)/, '/index.html');
		var getArgsString = url.slice(url.lastIndexOf('?') >>> 0)
		url = url.slice(0, url.lastIndexOf('?') >>> 0);

		if(User_isDynamicUrl(url)) {
			var recData = '';
			req.setEncoding('binary');


			req.addListener('data', function(data) {
				//log('data = ', data);
				recData += data;
			});

			req.addListener('end', function() {
				//log('end');
				req.isEnded = true;
			});

			fs.readFile(
				url.urlToFsPath(),
				function(err, data) {
					if(err) {
						res.writeHead(404);
						res.end();
					};

					//log(data);
					//Script.runInThisContext('(' + data + ')();', url);
					Script.runInNewContext('(' + data + ')($G, req, res, recData);', {$G: $G, req: req, res: res, recData: recData, sys: sys, setTimeout: setTimeout, setInterval: setInterval, require: require}, url.urlToFsPath());
				}
			);
		}
		else if(Url_isFolder(url)) {
			try {
				fs.statSync(url.urlToFsPath())
				res.writeHead(200, { 'Content-Type': "text/html" });

				var fileNames = fs.readdirSync(url.urlToFsPath())
				var json = { files: {  }, folders: {  } }
				//log(url, fileNames)
				var formatDate = function(d) {
					return "".concat(d.getFullYear(),
						"-",
						("0" + (d.getMonth() + 1)).slice(-2),
						"-",
						("0" + d.getDate()).slice(-2),
						" ",
						("0" + d.getHours()).slice(-2),
						":",
						("0" + d.getMinutes()).slice(-2),
						":",
						("0" + d.getSeconds()).slice(-2),
						""
					)
				}
				var html = "<body><pre>"
				;(fileNames
					.filter(function(v) {
						return v.match(/^\.+$/) == null && fs.statSync(path.join(url.urlToFsPath(), v)).isDirectory()
					})
					.sort(function(a, b) {
						return a.toLowerCase().localeCompare(b.toLowerCase())
					})
					.forEach(function(v) {
						html += "".concat("<a href='", v, "/'>", v, "/</a>\n")
					})
				)
				;(fileNames
					.filter(function(v) {
						return fs.statSync(path.join(url.urlToFsPath(), v)).isFile()
					})
					.sort(function(a, b) {
						return a.toLowerCase().localeCompare(b.toLowerCase())
					})
					.forEach(function(v) {
						html += "".concat("<a href='", v, "'>", v, "</a>\n")
					})
				)
				html += "</pre></body>"
				res.write(html)
			}
			catch(err) {
				console.log(err, url)
				res.writeHead(404, { 'Content-Type': "text/html" });
			}
			res.end();
		}
		else {
			fs.readFile(
				url.urlToFsPath(),
				function(err, data) {
					if(err) {
						res.writeHead(404, {
							'Content-Type': extToMimeMap[Url_getExt(url)] || 'text/plain'
						});
						res.end();
					}

					res.writeHead(200, {
						'Content-Type': extToMimeMap[Url_getExt(url)] || 'text/plain',
						//'Accept-Ranges': 'bytes',
						//'Cache-Control': 'max-age=0',
						//'Content-Length': data.length,
						//'Connection': 'close'
						'Expires': (new Date()).toGMTString()
					});
					res.end(data);
				}
			);
		}
	}

	http.createServer(Server_onRequest).listen(httpPort);
	https.createServer({
			key: fs.readFileSync(httpsKeyPemFilePath),
			cert: fs.readFileSync(httpsCertFilePath)
		},
		Server_onRequest
	).listen(httpsPort);

	sys.puts("".concat("Server running at http://", hostName, ":", httpPort, "/"));
	sys.puts("".concat("Server running at https://", hostName, ":", httpsPort, "/"));

})(this);
