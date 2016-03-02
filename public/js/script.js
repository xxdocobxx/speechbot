var socket = io.connect();

var current_irc_channel = "";

$(function() {
	$(document).on("click focus", ".control-group.error input", function() {
		$(this).parents(".control-group.error").removeClass("error")
	});


	$("#connect-form").submit(function() {
		current_irc_channel = $("#irc-channel").val().replace(/#/g, "");
		
		var irc_server = $("#irc-server").val()
		var irc_port = $("#irc-port").val()
		var irc_username = $("#irc-username").val()
		var irc_password = $("#irc-password").val()
		var irc_channel = $("#irc-channel").val()
		if(!irc_server) {
			$("#irc-server").parents(".control-group").addClass("error")
		}
		if(!irc_port) {
			$("#irc-port").parents(".control-group").addClass("error")
		}
		if(!irc_username) {
			$("#irc-username").parents(".control-group").addClass("error")
		}
		if(!irc_password) {
			$("#irc-password").parents(".control-group").addClass("error")
		}
		if(!irc_channel) {
			$("#irc-channel").parents(".control-group").addClass("error")
		}
		if(!irc_server && !irc_username && !irc_password && !irc_channel) {
			return false
		}
		socket.emit("connect-to-irc", irc_server, irc_port, irc_username, irc_password, irc_channel)
		$("#irc-server, #irc-port, #irc-username, #irc-password, #irc-channel").val("")
		$('#connect-form').parent().removeClass('open')
		return false
	});
	
	
	$("#send-form").submit(function() {
		var send_text = $("#send-text").val()
		
		socket.emit("send-message", send_text)
		
		$("#send-text").val("")
		
		return false
	});
});

var messageSize = 0;

function checkMessageSize()
{
	if(++messageSize > 50)
	{
		$("#messages").find("li:first").remove();
	}
}

function addMessage(msg)
{
	checkMessageSize();
	$("#messages").append($("<li></li>").html(replaceEmotIcon(msg)));
	$("#messages").get(0).scrollTop = $("#messages").get(0).scrollHeight;
}

socket.on("getMessage", function(nick, to, text) {
//console.log("getMessage",nick,to,text);
	if(/[/.]/.test(text.charAt(0)))
	{
		if(text.match("^/me "))
			text = text.replace("/me ", "");
		else
			return;
	}
	
	addMessage("<"+nick+"> "+text);
	
	speak(nick);
	speak("says")
	speak(text);
});

socket.on("getNotice", function(nick, to, text) {
	addMessage(text);
});

socket.on("clearChat", function() {
console.log("clearChat");
	messageSize = 0;
	$("#messages").empty();
	addMessage("Chat was cleared by a moderator");
});

socket.on("connected-to-irc", function() {
	getUserList();
	getEmotIcon();
});

function getUserList()
{
	if(current_irc_channel == "")
		return;
	
	
	$.getJSON('https://api.twitch.tv/kraken/streams/'+current_irc_channel+"?callback=?", function(data) {
		if(data.steam)
		{
			$("#viewers").html("Online - Viewers:"+data.stream.viewers);
		}else{
			$("#viewers").html("Offline");
		}
	});

//	socket.emit("get-names");
/*	
	$.getJSON("http://tmi.twitch.tv/group/user/"+current_irc_channel+"/chatters?callback=?", function(response) {
		var data = response.data;
		if(data)
		{
			$("#user-list").empty();
			$("#user-list").append($("<div></div>").text("Chatters: "+data.chatter_count));
			displayUsers(data.chatters);
		}
	});
*/
}

var namelist = new Object();

function displayNameList()
{
	if(namelist)
	{
		$("#user-list").empty();
		$("#user-list").append($("<div></div>").text("Chatters: " + Object.keys(namelist).length));
		for (key in namelist) {
			if (namelist.hasOwnProperty(key))
				$("#user-list").append($("<div></div>").text("- " + key));
		}	
	}
}

socket.on("names", function(nicks) {
	namelist = nicks;
	displayNameList();
});

socket.on("join", function(nick) {
	if(!namelist[nick])
		namelist[nick] = "";
	displayNameList();
});

socket.on("part", function(nick) {
	if(namelist[nick])
		delete namelist[nick];
	displayNameList();
});

function displayUsers(chattergroup)
{
	Object.keys(chattergroup).forEach(function(groupname, i, a) {
		chattergroup[groupname].forEach(function(chatter) {
			$("#user-list").append($("<div></div>").text("- "+chatter));
		});
	});
}

$("#send-text").keypress(function() {
	if(event.keyCode == 13) {
		if($("#send-text").val() != "") {
			$("#send-form").submit();
		}
		return false;
	}
});

var emotIcons = new Object();
var emotIconIndex = new Object();
var emotIconRegex = "";
function getEmotIcon()
{
	if(current_irc_channel == "")
		return;
	
	
	$.getJSON('https://api.twitch.tv/kraken/chat/'+current_irc_channel+"/emoticons?callback=?", function(data) {
		if(data.emoticons)
		{
			emotIcons = data.emoticons;
			for(var i = 0; i < data.emoticons.length; ++i)
			{
				var regex = escapeHtml(data.emoticons[i].regex);
				
				emotIconIndex[regex] = i;
				emotIconRegex += "\\b" + regex + "\\b" + "|";
			}
			
			emotIconRegex.slice(0, -1);
		}
	});
}

function replaceEmotIcon(text)
{
	text = escapeHtml(text);
	if(emotIcons)
	{
		var words = text.split(/\s*\s/);
		for(var i = 0;i < words.length; ++i)
		{
			emotIcons.forEach(function(emotIcon) {
				var regexp = new RegExp("^" + emotIcon.regex + "$");
				if(regexp.test(words[i]))
					words[i] = '<img src="'+emotIcon.url+'" width="'+emotIcon.width+'" height="'+emotIcon.height+'" alt="'+words[i]+'" title="'+words[i]+'">';
			});
		}
		text = words.join(" ");
/*		
		return text.replace(new RegExp(emotIconRegex,'g'), function (match) {
			if(typeof emotIconIndex[match] != 'undefined')
			{
				var id = emotIconIndex[match];
				
				return '<img src="'+emotIcons[id].url+'">';
			}
			else
			   return match;
	  });
*/
	}

	return text;
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
 
window.onload = function() {
	$("#connect-form").submit()
	setInterval(getUserList, 60000);
};