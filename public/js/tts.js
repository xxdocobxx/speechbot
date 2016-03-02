function loadVoices() {
	voiceSelect.innerHTML = '';
  
	// Fetch the available voices.
	var voices = speechSynthesis.getVoices();

	// Loop through each of the voices.
	voices.forEach(function(voice, i) {
	// Create a new option element.
		var option = document.createElement('option');
	// Set the options value and text.
		option.value = voice.name;
		option.innerHTML = voice.name;

	// Add the option to the voice selector.
		voiceSelect.appendChild(option);
	});

	voices.forEach(function(voice, i) {
		if(voice.lang == 'en-US')
		{
			voiceEnUS = i;
			return;
		}
	});
}
 
var voiceEnUS = 0;

var voiceSelect = document.getElementById('voice');

loadVoices();

window.speechSynthesis.onvoiceschanged = function(e) {
	loadVoices();
	window.speechSynthesis.onvoiceschanged = function(e) {}
};

function speak(text)
{
	var msg = new SpeechSynthesisUtterance();
	msg.text = text;

	var nonEng = /[^\u0000-\u036F]/;
	var nonDigit = /[A-Z]|[a-z]/;
	
	if( nonEng.test(text) || !(nonDigit.test(text)) )
	{	
		if (voiceSelect.value) {
			msg.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == voiceSelect.value; })[0];
		}
	}
	else
	{
		msg.voice = speechSynthesis.getVoices()[voiceEnUS];
	}

	msg.volume = 1;
	msg.rate = 1.2;
	msg.pitch = 1;

    window.speechSynthesis.speak(msg);
	return;
}