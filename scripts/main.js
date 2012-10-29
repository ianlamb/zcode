var canvas;
var stage;
var screen_width;
var screen_height;
var bmpAnimation;
var speed = 1.0;
var ticks = 0.0;

var Key = {
	_pressed: [],

	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	ENTER: 13,
	SHIFT: 16,

	isDown: function(keyCode) {
		return this._pressed[keyCode];
	},

	onKeypress: function(event) {
		this._pressed[event.keyCode] = true;
		console.log( String.fromCharCode( event.keyCode ) + " (" + event.keyCode + ") pressed!" );
	},

	onKeyup: function(event) {
		this._pressed[event.keyCode] = false;
		console.log( String.fromCharCode( event.keyCode ) + " (" + event.keyCode + ") released!" );
	}
};
window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
window.addEventListener('keypress', function(event) { Key.onKeypress(event); }, false);

var file = ["if(weRock){",
			"doAwesome();",
			"}"];
			
function getFile(){
  $.ajax({
	  url:'main.js',
	  success: function (data){
		  file = data;
	  }
  });
}
getFile();


var	currLineIndex = 0;
var currLine = file[currLineIndex];
var currCharIndex = 0;
var readyForNextLine = false;

var imgMonsterARun = new Image();

function init() {
	canvas = document.getElementById("z-canvas");

	imgMonsterARun.onload = handleImageLoad;
	imgMonsterARun.onerror = handleImageError;
	imgMonsterARun.src = "images/player.png";
}

function reset() {
	stage.removeAllChildren();
	createjs.Ticker.removeAllListeners();
	stage.update();
}

function handleImageLoad(e) {
	startGame();
}

function startGame() {
	// create a new stage and point it at our canvas:
	stage = new createjs.Stage(canvas);
	
	// grab canvas width and height for later calculations:
	screen_width = canvas.width;
	screen_height = canvas.height;
	
	// create spritesheet and assign the associated data.
	var spriteSheet = new createjs.SpriteSheet({
		// image to use
		images: [imgMonsterARun], 
		// width, height & registration point of each sprite
		frames: {width: 64, height: 64, regX: 32, regY: 32}, 
		animations: {	
			walk: [0, 3, true, 10]
		}
	});
	
	// create a BitmapAnimation instance to display and play back the sprite sheet:
	bmpAnimation = new createjs.BitmapAnimation(spriteSheet);

	// start playing the first sequence:
	bmpAnimation.gotoAndPlay("walk"); 	//animate

	bmpAnimation.name = "monster1";
	bmpAnimation.direction = 0;
	bmpAnimation.x = screen_width * 0.5;
	bmpAnimation.y = screen_height * 0.25;
		
	// have each monster start at a specific frame
	bmpAnimation.currentFrame = 0;
	stage.addChild(bmpAnimation);
		
	// we want to do some work before we update the canvas,
	// otherwise we could use Ticker.addListener(stage);
	createjs.Ticker.addListener(window);
	createjs.Ticker.useRAF = false;
	createjs.Ticker.setFPS(60);
}

//called if there is an error loading the image (usually due to a 404)
function handleImageError(e) {
	console.log("Error Loading Image : " + e.target.src);
}

function tick() {
	ticks+=0.25;
	bmpAnimation.x = (screen_width*0.5) + Math.sin( ticks * 0.05 ) * 200;
	bmpAnimation.y = (screen_height*0.25) + Math.tan( ticks * 0.05 ) * 10;
	
	var lblLinePrev2 = document.getElementById("line-prev2");
	if( file[ currLineIndex - 2 ] )
	{
		lblLinePrev2.textContent = file[ currLineIndex - 2 ];
	}
	else
	{
		lblLinePrev2.textContent = "...";
	}
	var lblLinePrev = document.getElementById("line-prev");
	if( file[ currLineIndex - 1 ] )
	{
		lblLinePrev.textContent = file[ currLineIndex - 1 ];
	}
	else
	{
		lblLinePrev.textContent = "...";
	}
	var lblLineCurr = document.getElementById("line-curr");
	var lblLettersTyped = document.getElementById("letters-typed");
	var lblLetterCurr = document.getElementById("curr-letter");
	var lblLettersRemaining = document.getElementById("letters-remaining");
	var lblNextLinePrompt = document.getElementById("next-line-prompt");
	if( file[ currLineIndex ] )
	{
		//lblLineCurr.textContent = file[ currLineIndex ];
		lblLettersTyped.textContent = currLine.substring(0,currCharIndex);
		lblLetterCurr.textContent = currLine.charAt( currCharIndex );
		lblLettersRemaining.textContent = currLine.substring( currCharIndex+1, currLine.length );
	}
	else
	{
		lblLettersTyped.textContent = "";
		lblLetterCurr.textContent = "";
		lblLettersRemaining.textContent = "...";
	}
	if( readyForNextLine )
	{
		lblNextLinePrompt.textContent = " [ENTER]";
	}
	else
	{
		lblNextLinePrompt.textContent = "";
	}
	var lblLineNext = document.getElementById("line-next");
	if( file[ currLineIndex + 1 ] )
	{
		lblLineNext.textContent = file[ currLineIndex + 1 ];
	}
	else
	{
		lblLineNext.textContent = "...";
	}
	var lblLineNext2 = document.getElementById("line-next2");
	if( file[ currLineIndex + 2 ] )
	{
		lblLineNext2.textContent = file[ currLineIndex + 2 ];
	}
	else
	{
		lblLineNext2.textContent = "...";
	}
	
	if( readyForNextLine && Key.isDown( Key.ENTER ) )
	{
		readyForNextLine = false;
		currCharIndex = 0;
		currLine = file[++currLineIndex];
		Key._pressed = [];
	}
	else
	{
		if( currLine != undefined && Key.isDown( currLine.charCodeAt(currCharIndex) ) )
		{
			if( ++currCharIndex > currLine.length - 1 )
			{
				readyForNextLine = true;
			}
			Key._pressed = [];
		}
	}

	stage.update();
}