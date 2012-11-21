var canvas;
var stage;
var screen_width;
var screen_height;
var bmpAnimation;
var speed = 1.0;
var elapsed = 0.0;
var enemies = new Array();
var gameover = false;
var gamewon = false;

var CH_DIAM = '\u25C6';
var CH_BULL = '\u25CF';
var CH_DBLB = '\u25C9';
var CH_TDIA = '\u25CA';
var CH_UCIR = '\u25E0';
var CH_LCIR = '\u25E1';
var CH_WBUL = '\u25E6';
var CH_SPACE_STANDIN = CH_WBUL;

var lasers = new Array();

var player = {
	maxShields: 1000,
	shields: 1000,
	firepower: 5,
    alive: function(){ return this.shields > 0; },
    x: 230,
    y: 280
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
	
	clearBuffer: function() {
		this._pressed = [];
	},

	isDown: function(keyCode) {
		return this._pressed[keyCode];
	},

	onKeydown: function(event) {
		this._pressed[event.keyCode] = true;
		console.log( String.fromCharCode( event.keyCode ) + " ("+event.keyCode+") pressed!" );
	},
};
window.addEventListener('keypress', function(event) { Key.onKeydown(event); }, false);

var SimpleLaser = function( displayObject1, displayObject2, durationSec, offsetX, offsetY )
{
    //this.__proto__ = new createjs.Shape();
    this.__proto__ = new createjs.Shape();
    this.displayObject1 = displayObject1;
    this.displayObject2 = displayObject2;
    this.life = durationSec;
    this.d0OffsetX = offsetX;
    this.d0OffsetY = offsetY;

    this.graphics.setStrokeStyle(0.5);

    this.alive = function(){ return this.life > 0; };

    this.updateGraphics = function()
    {
        this.graphics.clear().setStrokeStyle(2).beginStroke(createjs.Graphics.getRGB(0xFF0000));
        this.graphics.moveTo(this.displayObject1.x + this.d0OffsetX, this.displayObject1.y + this.d0OffsetY);
        this.graphics.lineTo(this.displayObject2.x, this.displayObject2.y);
    };

    this.onTick = function(delta)
    {
        this.life -= delta;
        this.updateGraphics();
    };
}

/*
var file = ["if(weRock){",
				"doAwesome();",
				"}",
				"this is",
				"some test data",
				"to help verify",
				"that everything is working correctly",
				"looks good to me",
				"but we need more lines",
				"so here are some more",
				"and another",
				"<><><><><><><><>",
				"to help verify",
				"!-!-!-! Hello World !-!-!-!",
				"looks good to me",
				"but we need more lines",
				"so here are some more",
				"and another",
				"<!-- This is a comment -->",
				"to help verify",
				"that everything is working correctly",
				"looks good to me",
				"but we need more lines",
				"so here are some more",
				"and another",
				"also we need support for special characters",
				"to help verify",
				"that everything is working correctly",
				"looks good to me",
				"but we need more lines",
				"so here are some more",
				"and another",
				"also we need support for special characters",
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
*/

// load a file into the game
var file;			
$.ajax({
	type: "GET",
	dataType: "text",
	url: "scripts/main.js",
	async: false,
	success: function(data){
		lines = data.split('\n');
		for(var i = 0; i < lines.length; i++)
		{
			// filter any crap out of the file here
			lines[i].replace(/^\s+|\s+$/g,'');
		}
		file = lines;
	},
	error: function(jqXHR, textStatus, errorThrown){
		file = [textStatus,
				errorThrown];
	}
});

var	currLineIndex = 0;
var currLine = file[currLineIndex];
var currCharIndex = 0;
var readyForNextLine = false;

var imgMonsterARun = new Image();
var imgEnemy01 = new Image();
var imagesToLoad = 0;

function init() 
{
	canvas = document.getElementById("z-canvas");

    imagesToLoad++;
    imgEnemy01.onload = handleImageLoad;
    imgEnemy01.onerror = handleImageError;
    imgEnemy01.src = "images/enemy01.png";
}

function reset() 
{
	stage.removeAllChildren();
	createjs.Ticker.removeAllListeners();
	stage.update();
}

function handleImageLoad(e) 
{
    if( --imagesToLoad == 0 )
    {
    	startGame();
    }
}

//called if there is an error loading the image (usually due to a 404)
function handleImageError(e) 
{
    console.log("Error Loading Image : " + e.target.src);
}

function startGame() 
{
	// create a new stage and point it at our canvas:
	stage = new createjs.Stage(canvas);
	// grab canvas width and height for later calculations:
	screen_width = canvas.width;
	screen_height = canvas.height;
	
    // setup shield bar dimentions
    uiShields.height = 25;
	uiShields.y = screen_height - uiShields.height + 1;
	uiShields.x = 0;
	uiShields.width = screen_width;

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

    // setup basic enemies
    var gfxEnemy01 = new createjs.SpriteSheet(
    {
        images: [imgEnemy01],
        frames: { width: 64, height: 64, regX: 32, regY: 32 },
        animations:
        {
            idle: 0,
            attack1: { frames: [1,1], frequency: 30, next: 'idle' },
            attack2: { frames: [2,2], frequency: 30, next: 'idle' }
        }   
    });
    var nEnemies = 5;
    for( var i = 0; i < nEnemies; ++i )
    {
        var newEnemy = new createjs.BitmapAnimation(gfxEnemy01);
        //newEnemy.health = 0;
        newEnemy.baseX = 100 + i * ( ( (screen_width - 200 ) + 100 ) / nEnemies ) + Math.random()*-20 + 10;
        newEnemy.baseY = Math.random()*20 + 30;
        newEnemy.animOffset = Math.floor( Math.random() * 10 ) * 10;
        newEnemy.gotoAndPlay( "idle" );
        newEnemy.nextAttackMark = Math.round(Math.random()*5);
        enemies.push( newEnemy );
        stage.addChild( newEnemy );
    }

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
	
	// draw the initial file context
	$('#z-context').html('');
	$('#z-context').append('<p id="line-0" class="context-curr"><span class="line-number">1:</span>'+file[0].substr(0,29)+'</p>');
	for(var i = 1; i < 20; i++) {
		$('#z-context').append('<p id="line-'+i+'" class="context-next"><span class="line-number">'+(i+1)+':</span>'+file[i].substr(0,29)+'</p>');
	}
}

function tick( delta, paused ) 
{
    delta/=1000; // delta comes in as milliseconds, convert to seconds
    if( gamewon )
    {
        // TODO: implement file picking ui
    }
    else if( !gameover )
    {
	    elapsed += delta;

        // update ui
        uiShields.fg.scaleX = ( player.shields / player.maxShields * 1.0 );
	    updateKeyboardUI();

        // check keyboard input
	    if (readyForNextLine && Key.isDown(Key.ENTER)) {
            player.shields += file[currLineIndex].length / 10 * 200 + 200;
	        readyForNextLine = false;
	        currCharIndex = 0;
	        currLine = file[++currLineIndex];

            if( !currLine )
            {
                gamewon = true;
            }
	    }
	    else {
	        if (Key.isDown(currLine.charCodeAt(currCharIndex))) {
	            if (++currCharIndex > currLine.length - 1) {
	                readyForNextLine = true;
	            }
	        }
	    }

        // drain player health constantly
        player.shields -= shieldDrain * delta;
        if( player.shields > player.maxShields ){ player.shields = player.maxShields; }
        if( player.shields < 0 ){ player.shields = 0; }

        for( var i = 0; i < enemies.length; ++i )
        {
            var e = enemies[i];
            e.y = e.baseY + Math.sin(elapsed * 2.0 + e.animOffset) * 15.0;
            e.x = e.baseX + Math.sin(elapsed + e.animOffset) * 28.0;

            if( elapsed > e.nextAttackMark )
            {
                e.nextAttackMark = elapsed + 3;
                var anim = Math.round(Math.random());
                e.gotoAndPlay( anim ? "attack1" : "attack2" );
                var laser = new SimpleLaser( e, player, 1, anim == 0 ? 9 : -9, 9 );
                stage.addChild( laser );
                lasers.push( laser );
            }
        }

        for( var i = 0; i < lasers.length; ++i )
        {
            if( !lasers[i].alive() )
            {
                stage.removeChild( lasers[i] );
                lasers.splice( i--, 1 );
            }
        }

        gameover = !player.alive();
        if( gameover )
        {
            // do once off gameover type stuff, like make gameover ui invisible
            uiGameoverContainer.visible = true;
            pauseAnimations();
        }
        else if( gamewon )
        {
            // do once off stuff, like make new file selection ui visible
        }
    }
    else // gameover
    {
        if( Key.isDown( Key.SPACE ) )
        {
            gameover = false; // go back to playing normally
            uiGameoverContainer.visible = false;
            // TODO: restart the game
            player.shields = player.maxShields;
            resumeAnimations();
        }
    }
    stage.update( delta );
    Key.clearBuffer();
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
        var currChar = currLine.charAt(currCharIndex);
        lblLetterCurr.textContent = currChar == ' ' ? CH_SPACE_STANDIN : currChar;
        lblLettersRemaining.textContent = currLine.substring(currCharIndex + 1, currLine.length);
    }
    else {
        lblLettersTyped.textContent = "";
        lblLetterCurr.textContent = "";
        lblLettersRemaining.textContent = "...";
    }

    // display a promt if a newline is required to proceed
    lblNextLinePrompt.textContent = readyForNextLine ? "[ENTER]" : "";

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
	
	// update file context
	var lastUpdated = parseInt($('.context-curr').attr('id').split('-')[1]);
	if(currLineIndex > lastUpdated)
	{
		$('.context-curr').removeClass('context-curr').addClass('context-prev').next().removeClass('context-next').addClass('context-curr');
		if(currLineIndex > 9)
		{
			$('#z-context').children().first().remove();
			var lastInContext = parseInt($('#z-context').children().last().attr('id').split('-')[1]);
			lastInContext++;
			$('#z-context').append('<p id="line-'+lastInContext+'" class="context-next"><span class="line-number">'+(lastInContext+1)+':</span>'+file[lastInContext].substr(0,29)+'</p>');
		}
	}
}

function pauseAnimations()
{
}

function resumeAnimations()
{
}