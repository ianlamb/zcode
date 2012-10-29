var canvas;
var stage;
var screen_width;
var screen_height;
var bmpAnimation;
var speed = 1.0;
var ticks = 0.0;
var enemies = new Array();
var gameover = false;
var gamewon = false;

var player = {
	maxShields: 1000,
	shields: 1000,
	firepower: 5,
    alive: function(){ return this.shields > 0; }
};

var shieldDrain = player.maxShields / 15.0; // should take 15 seconds to drain with no intervention

var uiShields = {
	bg: null,
    fg: null,
	width: null,
	height: null,
    x: null,
    y: null,
};

var uiGameoverContainer;
var uiGameoverOverlay;
var uiGameoverTitle;
var uiGamoverHint;

var Key = {
	_pressed: [],

	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	ENTER: 13,
    SPACE: 32,

	isDown: function(keyCode) {
		return this._pressed[keyCode];
	},

	onKeydown: function(event) {
		this._pressed[event.keyCode] = true;
		console.log( String.fromCharCode( event.keyCode ) + " pressed!" );
	},

	onKeyup: function(event) {
		delete this._pressed[event.keyCode];
		console.log( String.fromCharCode( event.keyCode ) + " released!" );
	}
};
window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);

var file = ["this is",
			"some test data",
			"to help verify",
			"that everything is working correctly",
			"looks good to me",
			"but we need more lines",
			"so here are some more",
			"and another",
			"also we need support for special characters",
			"just a couple more lines",
			"third last one",
			"almost done",
			"goodbye"];
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
	
    // setup shield bar dimentions
    uiShields.height = 25;
	uiShields.y = screen_height - uiShields.height - 3;
	uiShields.x = 3;
	uiShields.width = screen_width - 6;

    // draw shield bar bg, cache the result
	uiShields.bg = new createjs.Shape();
	uiShields.bg.x = uiShields.x;
	uiShields.bg.y = uiShields.y;
	uiShields.bg.graphics.beginFill(createjs.Graphics.getRGB(0, 0, 0));
	uiShields.bg.graphics.drawRect(0, 0, uiShields.width, uiShields.height);
    //uiShields.bg.cache(0, 0, uiShields.width, uiShields.height);

	// draw shield bar fg
	uiShields.fg = new createjs.Shape();
	uiShields.fg.x = uiShields.bg.x + 2;
	uiShields.fg.y = uiShields.bg.y + 2;
	uiShields.fg.graphics.beginFill( createjs.Graphics.getRGB(0xA6F3FF) );
	uiShields.fg.graphics.drawRect(0, 0, uiShields.width - 4, uiShields.height - 4);
    
    // add uishields to stage
	stage.addChild(uiShields.bg);
	stage.addChild(uiShields.fg);
	
	// create spritesheet and assign the associated data.
	var spriteSheet = new createjs.SpriteSheet({
		// image to use
		images: [imgMonsterARun], 
		// width, height & registration point of each sprite
		frames: {width: 64, height: 64, regX: 32, regY: 32}, 
		animations: {	
			idle: [0, 3, true, 10]
		}
	});

    // add ship (enemy) to scene
    bmpAnimation = new createjs.BitmapAnimation(spriteSheet);
	bmpAnimation.name = "ship";
	bmpAnimation.direction = 0;
	bmpAnimation.x = screen_width * 0.5;
	bmpAnimation.y = screen_height * 0.25;
    bmpAnimation.gotoAndPlay("idle");
	stage.addChild(bmpAnimation);

    // setup and draw game over screen
    uiGameoverContainer = new createjs.Container();
    // game over title
    uiGameoverOverlay = new createjs.Shape();
    uiGameoverOverlay.graphics.beginFill( createjs.Graphics.getRGB( 0, 0, 0, 0.5 ) );
    uiGameoverOverlay.graphics.drawRect( 0, 0, screen_width, screen_height );
    uiGameoverContainer.addChild( uiGameoverOverlay );
    uiGameoverTitle = new createjs.Text("Game Over", "bold 58pt Arial", createjs.Graphics.getRGB(255,255,255));
    uiGameoverTitle.x = screen_width * 0.5;
    uiGameoverTitle.y = 30;
    uiGameoverTitle.textAlign = "center";
    uiGameoverContainer.addChild( uiGameoverTitle );
    //uiGameoverTitle.shadow = new createjs.Shadow( createjs.Graphics.getRGB( 0xffffff, 1 ), 0, 0, 15 );
    // game over call to action
    uiGameoverHint = new createjs.Text("Press SPACE to try again!", "16pt Arial", createjs.Graphics.getRGB(200,200,200));
    uiGameoverHint.textAlign = "center";
    uiGameoverHint.x = screen_width * 0.5;
    uiGameoverHint.y = screen_height * 0.5;
    uiGameoverContainer.addChild( uiGameoverHint );
    // add game over screen to stage, but hide until later
    stage.addChild( uiGameoverContainer );
    uiGameoverContainer.visible = false;
		
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

    if( gamewon )
    {
        // TODO: implement file picking ui
    }
    else if( !gameover )
    {
	    var elapsed = 1/60;
	    ticks += elapsed;

        // update ui
        uiShields.fg.scaleX = ( player.shields / player.maxShields * 1.0 );
	    updateKeyboardUI();

        // check keyboard input
	    if (readyForNextLine && Key.isDown(Key.ENTER)) {
            player.shields += file[currLineIndex].length / 10 * 100;
	        readyForNextLine = false;
	        currCharIndex = 0;
	        currLine = file[++currLineIndex];

            if( !currLine )
            {
                gamewon = true;
            }
	    }
	    else {
	        if (Key.isDown(currLine.toUpperCase().charCodeAt(currCharIndex))) {
	            if (++currCharIndex > currLine.length - 1) {
	                readyForNextLine = true;
	            }
	        }
	    }

        // drain player health constantly
        player.shields -= shieldDrain * elapsed;

        // update enemy spaceship animations
	    bmpAnimation.x = (screen_width * 0.5) + Math.sin( ticks ) * 200;
	    bmpAnimation.y = (screen_height * 0.25) + Math.tan(ticks) * 10;

        gameover = !player.alive();
        if( gameover )
        {
            // do once off gameover type stuff, like make gameover ui invisible
            uiGameoverContainer.visible = true;
        }
        else if( gamewon )
        {
            // do once off stuff, like make new file selection ui visible
        }

        stage.update();
    }
    else // gameover
    {
        gameover = !Key.isDown( Key.SPACE );
        if( !gameover )
        {
            uiGameoverContainer.visible = false;
            // TODO: restart the game
            player.shields = player.maxShields;
        }
    }
}

function updateKeyboardUI() 
{
    // update prev2 line display
    var lblLinePrev2 = document.getElementById("line-prev2");
    if (file[currLineIndex - 2]) {
        lblLinePrev2.textContent = file[currLineIndex - 2];
    }
    else {
        lblLinePrev2.textContent = "...";
    }

    // update prev line display
    var lblLinePrev = document.getElementById("line-prev");
    if (file[currLineIndex - 1]) {
        lblLinePrev.textContent = file[currLineIndex - 1];
    }
    else {
        lblLinePrev.textContent = "...";
    }

    // update current line display
    var lblLineCurr = document.getElementById("line-curr");
    var lblLettersTyped = document.getElementById("letters-typed");
    var lblLetterCurr = document.getElementById("curr-letter");
    var lblLettersRemaining = document.getElementById("letters-remaining");
    var lblNextLinePrompt = document.getElementById("next-line-prompt");
    if (file[currLineIndex]) {
        lblLettersTyped.textContent = currLine.substring(0, currCharIndex);
        lblLetterCurr.textContent = currLine.charAt(currCharIndex);
        lblLettersRemaining.textContent = currLine.substring(currCharIndex + 1, currLine.length);
    }
    else {
        lblLettersTyped.textContent = "";
        lblLetterCurr.textContent = "";
        lblLettersRemaining.textContent = "...";
    }

    // update new line prompt
    if (readyForNextLine) {
        lblNextLinePrompt.textContent = "[ENTER]";
    }
    else {
        lblNextLinePrompt.textContent = "";
    }

    // update next line display
    var lblLineNext = document.getElementById("line-next");
    if (file[currLineIndex + 1]) {
        lblLineNext.textContent = file[currLineIndex + 1];
    }
    else {
        lblLineNext.textContent = "...";
    }

    // update next2 line display
    var lblLineNext2 = document.getElementById("line-next2");
    if (file[currLineIndex + 2]) {
        lblLineNext2.textContent = file[currLineIndex + 2];
    }
    else {
        lblLineNext2.textContent = "...";
    }
}