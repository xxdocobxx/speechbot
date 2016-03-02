var irc = require("irc"),
	file = new(require("node-static").Server)('./public'),
	port = process.argv[2] || 8333;

var server = require('http').createServer(function (request, response) {

	response.setHeader("Access-Control-Allow-Origin", "*");
	
	request.resume();

	request.addListener('end', function () {
		file.serve(request, response);
    });
	
})
server.listen(port);
console.log("Server listening on http://localhost:"+port)

var io = require("socket.io").listen(server)

var currentChannel="";

io.sockets.on("connection", function(socket) {
	socket.on("connect-to-irc", function(server, pt, nick, pw, channel) {
		currentChannel=channel;
		
		console.log("Connect to", server);
		var client = new irc.Client(server, nick, {
//			channels: [channel],
			port: pt,
			userName: nick,
			password: pw,
			autoConnect: false
		});
		
		client.connect(3, function(input) {
			console.log("Connected!");
			
			client.send("CAP REQ :twitch.tv/membership", "");
			client.send("CAP REQ :twitch.tv/commands", "");
			client.join(channel, null);
			client.send("TWITCHCLIENT 3");
			
			socket.emit("connected-to-irc");
		});
		
		
		client.addListener('message', function(nick, to, text, message) {
			console.log("Message:", nick, to, text);
			if(to == channel) {
				socket.emit("getMessage", nick, to, text);
			}
		});

		client.addListener('selfMessage', function(to, text) {
			console.log("SelfMessage:", nick, to, text);
			if(to == channel) {
				socket.emit("getMessage", nick, to, text);
			}
		});

		client.addListener('notice', function(nick, to, text, message) {
			console.log("Notice:", nick, to, text, message);
			socket.emit("getNotice", nick, to, text);
		});

		client.addListener('ctcp', function(from, to, text, type, message) {
			console.log("ctcp:", from, to, text, type, message);
			socket.emit("getMessage", from, to, text.replace("ACTION ", ""));
		});

		client.addListener('names', function(to, nicks) {
			console.log("Names:", to, nicks);
			socket.emit("names", nicks);
		});

		client.addListener('join', function(channel, nick, message) {
			console.log("Join:", channel, nick, message);
			socket.emit("join", nick);
		});

		client.addListener('part', function(channel, nick, reason, message) {
			console.log("Part:", channel, nick, reason, message);
			socket.emit("part", nick);
		});

		client.addListener('raw', function(message) {
			console.log("Raw:", message);
			if(message.command == "CLEARCHAT")
			{
				console.log("ClearChat:", message);
				socket.emit("clearChat");
			}
		});

		client.addListener('error', function(message) {
			console.log("Error", message);
		});

		socket.on("send-message", function(msg) {
			client.say(channel, msg);
		});
		
		socket.on("get-names", function() {
			client.send("JOIN", channel);
		});
		
	});
	
});

