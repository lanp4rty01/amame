//
// AMAME socket.js
// jariseon 2018-08-11
//
var AMAME = AMAME || {}

AMAME.Socket = function ()
{
  var self = this;
	var wsurl = location.origin.startsWith("https") ? "wss" : "ws";
  wsurl += "://" + location.host + "/amame/socket";
	var ws = new WebSocket(wsurl);
	ws.binaryType = "arraybuffer";			

	ws.onopen = function () {
    if (self.onopen) self.onopen();
	}

	ws.onmessage = function (e) {
		var data;
		if (typeof e.data == "string") data = e.data;
		else data = new Uint8Array(e.data);
		if (self.onmessage) self.onmessage(data);
	}

	ws.onclose = function (e) {
		console.log("ws closed");
	};

	ws.onerror = function (e) {
		console.log("ws error");
	};

	this.sendString = function (s) {
		var b = new Uint8Array(s.length);
		for (var i = 0; i < s.length; i++)
			b[i] = s.charCodeAt(i);
		ws.send(b);
	}
  
  this.close = () => { ws.close(); }
}
