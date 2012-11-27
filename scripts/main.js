var sm;
var canvas;
var stage;
var screen_width;
var screen_height;
var bmpAnimation;
var speed = 1.0;
var elapsed = 0.0;

var enemies = new Array();
var smallExplodies = new Array();
var greenExplodies = new Array();
var explodies = new Array();
var bigExplodies = new Array();

var gameover = false;
var gamewon = false;
var gamestarted = false;
var lastEnemySpawnMark = 0;
var enemySpawnDelay = 2;
var file;
var completedLevelURLs = new Array();
var selectedLevelURL = "";

var CH_WBUL = '\u25E6';
var CH_SPACE_STANDIN = CH_WBUL;

var lasers = new Array();

var preloader;

var player = {
	maxShields: 1000,
	shields: 1000,
	firepower: 5,
    alive: function(){ return this.shields > 0; },
    x: 230,
    y: 225,
	nextAttackMark: 0,
	attackDelay: 0.5,
	attackDamage: 1,
	gfx: null,
	nActiveLasers: 1
};

var laserPositions = new Array();
laserPositions[0] = { x:80, y:255, used:false };
laserPositions[1] = { x:380, y:255, used:false };
laserPositions[2] = { x:102, y:218, used:false };
laserPositions[3] = { x:361, y:218, used:false };

var weaponLevels = new Array();
weaponLevels[0] = { url:"variables.js", completed:true, locked:false };
weaponLevels[1] = { url:"operators.js", completed:false, locked:false };
weaponLevels[2] = { url:"comparisons.js", completed:false, locked:true };
weaponLevels[3] = { url:"loops.js", completed:false, locked:true };
weaponLevels[4] = { url:"functions.js", completed:false, locked:true };
$.jStorage.set('weaponLevels', weaponLevels);

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

var letterShieldBonus = 15;

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
		//console.log( String.fromCharCode( event.keyCode ) + " ("+event.keyCode+") pressed!" );
	},
};
window.addEventListener('keypress', function(event) { Key.onKeydown(event); }, false);

var SimpleLaser = function( pos1, pos2, durationSec, pos1OffsetX, pos1OffsetY, laserColor )
{
    //this.__proto__ = new createjs.Shape();
    this.__proto__ = new createjs.Shape();
    this.pos1 = pos1;
    this.pos2 = pos2;
    this.life = durationSec;
    this.pos1OffsetX = pos1OffsetX;
    this.pos1OffsetY = pos1OffsetY;
	this.color = laserColor || 0xFF0000;

    this.graphics.setStrokeStyle(0.5);

    this.alive = function(){ return this.life > 0; };

    this.updateGraphics = function()
    {
        this.graphics.clear().setStrokeStyle(2).beginStroke(createjs.Graphics.getRGB( this.color ));
        this.graphics.moveTo(this.pos1.x + this.pos1OffsetX, this.pos1.y + this.pos1OffsetY);
        this.graphics.lineTo(this.pos2.x, this.pos2.y);
    };

    this.onTick = function(delta)
    {
        this.life -= delta;
        this.updateGraphics();
    };
}

var	currLineIndex = 0;
var currLine = 0;
var currCharIndex = 0;
var readyForNextLine = false;

var imgGreenExplody = new Image();
var imgSmallExplody = new Image();
var imgBigExplody = new Image();
var imgExplody = new Image();
var imgMonsterARun = new Image();
var imgEnemy01 = new Image();
var imgPlayer = new Image();
var imagesToLoad = 0;

var gfxEnemy01;
var nEnemies = 5;

// load a code file and start the game	
function loadGameFile(fileURL)
{		
	if( fileURL )
	{
		$.ajax({
			type: "GET",
			dataType: "text",
			url: fileURL,
			async: false,
			success: function(data){
				lines = data.split('\n');
				for( var i = 0; i < lines.length; ++i )
				{
					lines[i] = lines[i] + '\n';
				}
				file = lines;
				currLine = file[currLineIndex];

				gamewon = false;
				gamestarted = true;
				currLineIndex = 0;
				currCharIndex = 0;
				player.shields = player.maxShields;
				readyForNextLine = false;

				hideLevelsMenu();
				//$('#page-fade').fadeOut(300);
				//$('#levels-menu').slideUp(500);

				startGame();
			},
			error: function(jqXHR, textStatus, errorThrown){
				file = [textStatus,
						errorThrown];
			}
		});
	}
	else
	{
		alert( "Hey, pick a file, what's your problem?" );
		return false;
	}
}

function showLevelsMenu()
{
	for(var i = 0; i < $.jStorage.get('weaponLevels').length; i++)
	{
		var currLevel = $.jStorage.get('weaponLevels')[i];
		if(currLevel.completed)
		{
			$('.levels-option').each(function() {
				if( $(this).attr('href') == 'levels/' + currLevel.url )
					$(this).addClass('completed');
			});
		}
		else if(currLevel.locked)
		{
			$('.levels-option').each(function() {
				if( $(this).attr('href') == 'levels/' + currLevel.url )
					$(this).addClass('locked');
			});
		}
	}
	$('#page-fade').fadeIn(300);
	$('#levels-menu').slideDown(500);
}
function hideLevelsMenu()
{
	if( !gamewon && gamestarted )
	{
		$('#page-fade').fadeOut(300);
		$('#levels-menu').slideUp(500);
	}
}

// Initialize
function init() 
{
	canvas = document.getElementById("z-canvas");

    imagesToLoad++;
    imgEnemy01.onload = handleImageLoad;
    imgEnemy01.onerror = handleImageError;
    imgEnemy01.src = "images/enemy01.png";

    imagesToLoad++;
    imgPlayer.onload = handleImageLoad;
    imgPlayer.onerror = handleImageError;
    imgPlayer.src = "images/mantaray.png";

    imagesToLoad++;
    imgExplody.onload = handleImageLoad;
    imgExplody.onerror = handleImageError;
    imgExplody.src = "images/explody.png";

    imagesToLoad++;
    imgBigExplody.onload = handleImageLoad;
    imgBigExplody.onerror = handleImageError;
    imgBigExplody.src = "images/bigExplody.png";

    imagesToLoad++;
    imgSmallExplody.onload = handleImageLoad;
    imgSmallExplody.onerror = handleImageError;
    imgSmallExplody.src = "images/smallExplody.png";

    imagesToLoad++;
    imgGreenExplody.onload = handleImageLoad;
    imgGreenExplody.onerror = handleImageError;
    imgGreenExplody.src = "images/greenExplody.png";
	

	// Level selection
	showLevelsMenu();
	
	$('#show-levels').bind('click', function() {
		showLevelsMenu();
	});
	$('#page-fade').bind('click', function() {
		hideLevelsMenu();
	});
	$('.levels-option').bind('click', function(e) {
		$('.levels-selected').removeClass('levels-selected');
		$(this).addClass('levels-selected');
		if(selectedLevelURL == "")
			$('#pick-level').fadeIn();
		selectedLevelURL = $(this).attr('href');
		return false;
	});
	$('#pick-level').bind('click', function() {
		loadGameFile(selectedLevelURL);
	});
	$('#pause-game').bind('click', function() {
		// TODO: add pause/unpause
		if($(this).html() == "Pause Game") {
			$(this).html('Resume Game');
			// pause();
		} else {
			$(this).html('Pause Game');
			// unpase();
		}
	});
	$('#restart-game').bind('click', function() {
		// TODO: fix reset method
		if(file != null) {
			loadGameFile(selectedLevelURL);
		} else {
			alert("Please choose a level to start playing");
			showLevelsMenu();
		}
	});
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
    	//startGame();
    }
}

//called if there is an error loading the image (usually due to a 404)
function handleImageError(e) 
{
    console.log("Error Loading Image : " + e.target.src);
}

function handleFileError(o) {
	// An error occurred.
	displayStatus.innerText = "Error :("
	alert( "Sound loading failed!" );
}

function startGame() 
{
	var SND_LASER_SHOOT = {src:"sounds/Laser_Shoot2.ogg", id:"SND_LASER_SHOOT"};
	var SND_ENEMY_EXPLODE = {src:"sounds/enemyExplode.ogg", id:"SND_ENEMY_EXPLODE"};
	var SND_PLAYER_HURT = {src:"sounds/playerDamage.ogg", id:"SND_PLAYER_HURT"};
	var SND_PLAYER_LASER = {src:"sounds/playerLaser.ogg", id:"SND_PLAYER_LASER"};
	// Instantiate a preoloader.
	preloader = new createjs.PreloadJS();
	preloader.installPlugin(createjs.SoundJS); // Plug in SoundJS to handle browser-specific paths
	//preloader.onComplete = loadComplete;
	preloader.onFileError = handleFileError;
	//preloader.onProgress = handleProgress;
	preloader.loadFile(SND_LASER_SHOOT, true);
	preloader.loadFile(SND_ENEMY_EXPLODE, true);
	preloader.loadFile(SND_PLAYER_LASER, true);
	preloader.loadFile(SND_PLAYER_HURT, true);
	createjs.SoundJS.checkPlugin( true ); // initialize soundjs
	sm = createjs.SoundJS;

	// create a new stage and point it at our canvas:
	stage = new createjs.Stage(canvas);
	// grab canvas width and height for later calculations:
	screen_width = canvas.width;
	screen_height = canvas.height;

	// add the player graphic
	player.gfx = new createjs.Bitmap( imgPlayer );
    player.gfx.x = 50;
    player.gfx.y = 200;
    stage.addChild( player.gfx );
	
    // setup shield bar dimentions
    uiShields.height = 25;
	uiShields.y = screen_height - uiShields.height + 1;
	uiShields.x = 0;
	uiShields.width = screen_width;

    // draw shield bar bg, cache the result
	uiShields.bg = new createjs.Shape();
	uiShields.bg.x = uiShields.x;
	uiShields.bg.y = uiShields.y;
	uiShields.bg.graphics.beginFill(createjs.Graphics.getRGB(255, 0, 0));
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
    gfxEnemy01 = new createjs.SpriteSheet(
    {
        images: [imgEnemy01],
        frames: { width: 64, height: 64, regX: 32, regY: 32 },
        animations:
        {
            idle: 0,
            attack1: { frames: [1,1], frequency: 5, next: 'idle' },
            attack2: { frames: [2,2], frequency: 5, next: 'idle' }
        }   
    });
    nEnemies = 5;
    for( var i = 0; i < nEnemies; ++i )
    {
		var newEnemy = createEnemy( i );
        newEnemy.nextAttackMark = i + 5;
        enemies[ i ] = newEnemy;
        stage.addChild( newEnemy );
    }

    gfxBigExplody = new createjs.SpriteSheet(
    {
        images: [imgBigExplody],
        frames: { width: 64, height: 64, regX: 32, regY: 32 },
        animations:
        {
            idle: [ 0, 24, "" ]
        }   
    });

    var gfxSmallExplody = new createjs.SpriteSheet(
    {
        images: [imgSmallExplody],
        frames: { width: 32, height: 32, regX: 16, regY: 16 },
        animations:
        {
            idle: [ 0, 24, "" ]
        }   
    });

    for( var i = 0; i < 30; ++i )
    	smallExplodies.push( createBigExplody( gfxSmallExplody ) );

    var gfxGreenExplody = new createjs.SpriteSheet(
    {
        images: [imgGreenExplody],
        frames: { width: 32, height: 32, regX: 16, regY: 16 },
        animations:
        {
            idle: [ 0, 24, "" ]
        }   
    });

    for( var i = 0; i < 30; ++i )
    {
    	greenExplodies.push( createBigExplody( gfxGreenExplody ) );
    }

    // create BigExplody pool
    for( var i = 0; i < 30; ++i )
    {
    	bigExplodies.push( createBigExplody() );
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

function getNumEnemies()
{
	var nEnemiesAlive = 0;
	for( var i = 0; i < enemies.length; ++i )
	{
		if( enemies[i] != null )
			nEnemiesAlive++;
	}
	return nEnemiesAlive;
}

function getEmptyEnemyIndex()
{
	for( var i = 0; i < enemies.length; ++i )
	{
		if( enemies[i] == null )
			return i;
	}
	return -1;
}

function getRandomEnemy()
{
	var validEnemies = new Array();
	for( var i = 0; i < enemies.length; ++i )
	{
		if( enemies[i] != null )
			validEnemies.push( enemies[i] );
	}
	
	if( validEnemies.length > 0 )
		return validEnemies[ Math.floor( Math.random() * validEnemies.length ) ];
	else
		return null;
}

function createEnemy( slot )
{
	var pos = slot || 0;
	var newEnemy = new createjs.BitmapAnimation(gfxEnemy01);
	newEnemy.health = 5;
	newEnemy.baseX = 100 + pos * ( ( (screen_width - 200 ) + 100 ) / nEnemies ) + Math.random()*-20 + 10;
	newEnemy.baseY = Math.random()*20 + 30;
	newEnemy.animOffset = Math.floor( Math.random() * 10 ) * 10;
	newEnemy.gotoAndPlay( "idle" );
	newEnemy.nextAttackMark = elapsed + pos;
	newEnemy.attackDamage = 60;
	newEnemy.hurt = function( damage )
	{
		this.health--;
		if( this.health <= 0 )
		{
			this.visible = false;
			this.isAlive = false;
		}
	};
	newEnemy.isAlive = function()
	{
		return this.health > 0;
	}
	return newEnemy;
}

function createExplody( x, y, lifetime )
{
	var explody = new createjs.Bitmap( imgExplody );
	explody.x = x - 10;
	explody.y = y - 10;
	explody.killMark = elapsed + lifetime;
	return explody;
}

function createBigExplody( anim )
{
	var explody = new createjs.BitmapAnimation( anim || gfxBigExplody );
	explody.activate = function()
	{
		explody.visible = explody.active = true;
	}
	explody.deactivate = function()
	{
		explody.visible = explody.active = false;
	}
	explody.deactivate();
	stage.addChild( explody );
	return explody;
}

function repopulateEnemies()
{
	var enemyIndex = 0;
	if( elapsed - lastEnemySpawnMark > enemySpawnDelay 
		&& getNumEnemies() < nEnemies 
		&& (enemyIndex = getEmptyEnemyIndex()) != -1 )
	{
		lastEnemySpawnMark = elapsed;
		var newEnemy = createEnemy( enemyIndex );
        enemies[ enemyIndex ] = newEnemy;
        stage.addChild( newEnemy );
	}
}

function getRandomLaserPosition()
{
	var usableIndices = new Array();
	for( var i = 0; i < laserPositions.length; i++ )
	{
		if( laserPositions[i].used == false )
		{
			usableIndices.push( i );
		}
	}

	var randIndex = usableIndices[ Math.floor( Math.random()*usableIndices.length ) ];

	return laserPositions[ randIndex ];
}

function getNextActiveMember( pool )
{
	if( pool )
	{
		for( var i = 0; i < pool.length; ++i )
		{
			if( !pool[i].active )
				return pool[i];
		}
	}
	else
	{
		return null;
	}
}

function tick( delta, paused ) 
{
    delta/=1000; // delta comes in as milliseconds, convert to seconds
    if( gamewon )
    {
        showLevelsMenu();
    }
    else if( !gameover )
    {
	    elapsed += delta;

		// UPDATE UI
        uiShields.fg.scaleX = ( player.shields / player.maxShields * 1.0 );
	    updateKeyboardUI();

		// KEYBOARD STUFF
		// if waiting for enter, and player has pressed enter
		//		- move to the next line
		// 		- award some shields
	    if (readyForNextLine && Key.isDown(Key.ENTER)) {
            player.shields += file[currLineIndex].length / 10 * 200 + 200;
	        readyForNextLine = false;
	        currCharIndex = 0;
	        currLine = file[++currLineIndex];

            if( !currLine )
            {
                gamewon = true;
            }

            //alert( escape(currLine) );
            if( currLine == '\n' )
            {
            	readyForNextLine = true;
            }
	    }
	    else {
			// if the player hit the current character
			//		- give a little shield bonus
			//		- move to the next character, unless it's on the next line, in which case we look for the enter key next time around
	        if (Key.isDown(currLine.charCodeAt(currCharIndex))) {
				player.shields += letterShieldBonus;
	            if (++currCharIndex > currLine.length - 2) { // change to -2 because we're jamming a \n onto the end of each line
	                readyForNextLine = true;
	            }
	        }
	    }
		
		repopulateEnemies();

		// UPDATE ENEMIES
        for( var i = 0; i < enemies.length; ++i )
        {
            var e = enemies[i];
			if( e )
			{
				if( e.isAlive )
				{
					e.y = e.baseY + Math.sin(elapsed * 2.0 + e.animOffset) * 15.0;
					e.x = e.baseX + Math.sin(elapsed + e.animOffset) * 28.0;

					if( elapsed > e.nextAttackMark )
					{
						e.nextAttackMark = elapsed + 5;
						var anim = Math.round(Math.random());
						e.gotoAndPlay( anim ? "attack1" : "attack2" );

						var attackPos = { x:0, y:0 };
						attackPos.x = player.x + Math.random() * 30 - 15;
						attackPos.y = player.y + Math.random() * 50 - 20;

						var laser = new SimpleLaser( e, attackPos, 0.25, anim == 0 ? 9 : -9, 9 );
						stage.addChild( laser );
						lasers.push( laser );

						/*
						var explody = createExplody( attackPos.x, attackPos.y, 0.25 );
						stage.addChild( explody );
						explodies.push( explody );
						*/

						var expld = getNextActiveMember( smallExplodies );
						if( expld )
						{
							expld.activate();
							expld.killMark = elapsed + 0.45;
							expld.x = attackPos.x;
							expld.y = attackPos.y;
							expld.gotoAndPlay("idle");
						}
						
						sm.play( "SND_LASER_SHOOT", createjs.SoundJS.INTERRUPT_NONE , 0, 0, 0, 0.25, 0 );
						sm.play( "SND_PLAYER_HURT", createjs.SoundJS.INTERRUPT_NONE , 0, 0, 0, 1, 0 );
						
						player.shields -= e.attackDamage;
					}
				}
				else
				{
					var be = getNextActiveMember( bigExplodies );
					if( be )
					{
						be.activate();
						be.killMark = elapsed + 0.45;
						be.x = e.x;
						be.y = e.y;
						be.gotoAndPlay("idle");
					}

					stage.removeChild( e );
					enemies[i] = null;
				}
			}
        }

		// UPDATE LASERS
        for( var i = 0; i < lasers.length; ++i )
        {
            if( !lasers[i].alive() )
            {
                stage.removeChild( lasers[i] );
                lasers.splice( i--, 1 );
            }
        }

        // UPDATE EXPLODIES
        for( var i = 0; i < explodies.length; ++i )
        {
        	if( elapsed > explodies[i].killMark )
        	{
        		stage.removeChild( explodies[i] );
        		explodies.splice( i--, 1 );
        	}
        }

        // UPDATE BIG EXPLODIES
        for( var i = 0; i < bigExplodies.length; ++i )
        {
        	if( bigExplodies[i].active && elapsed > bigExplodies[i].killMark )
        	{
        		bigExplodies[i].deactivate();
        	}
        }

        // UPDATE SMALL EXPLODIES
        for( var i = 0; i < smallExplodies.length; ++i )
        {
        	if( smallExplodies[i].active && elapsed > smallExplodies[i].killMark )
        	{
        		smallExplodies[i].deactivate();
        	}
        }

        // UPDATE GREEN EXPLODIES
        for( var i = 0; i < greenExplodies.length; ++i )
        {
        	if( greenExplodies[i].active && elapsed > greenExplodies[i].killMark )
        	{
        		greenExplodies[i].deactivate();
        		sm.play( "SND_ENEMY_EXPLODE", createjs.SoundJS.INTERRUPT_NONE , 0, 0, 0, 1, 0 );
        	}
        }
		
		// PLAYER SHIP ATTACK LOGIC
		if( elapsed > player.nextAttackMark )
		{
			player.nextAttackMark = elapsed + player.attackDelay;
			for( var i = 0; i < player.nActiveLasers; ++i )
			{
				var laserPosition = getRandomLaserPosition();
				if( laserPosition )
				{
					laserPosition.used = true;

					var enemy = getRandomEnemy();
					if( enemy && enemy.isAlive() )
					{
						enemy.hurt( player.attackDamage );
						
						var laser = new SimpleLaser( laserPosition, enemy, 0.25, 0, 0, 0x00FF00 );
						stage.addChild( laser );
						lasers.push( laser );

						var expld = getNextActiveMember( greenExplodies );
						if( expld )
						{
							expld.activate();
							expld.killMark = elapsed + 0.45;
							expld.x = enemy.x;
							expld.y = enemy.y;
							expld.gotoAndPlay("idle");
						}

						sm.play( "SND_PLAYER_LASER", createjs.SoundJS.INTERRUPT_NONE , 0, 0, 0, 0.333, 0 );
					}
				}
			}
			for( var i = 0; i < laserPositions.length; ++i )
			{
				if( laserPositions[i] )
				{
					laserPositions[i].used = false;
				}
			}
		}
		

		// SHIELD VALUE CLAMPING
        if( player.shields > player.maxShields ){ player.shields = player.maxShields; }
        if( player.shields < 0 ){ player.shields = 0; }

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
		if( file[currLineIndex - 2] == '\n' )
			lblLinePrev2.textContent = '\u00A0';
		else
			lblLinePrev2.textContent = file[currLineIndex - 2];
    }
    else {
        lblLinePrev2.textContent = "...";
    }

    // update prev line display
    var lblLinePrev = document.getElementById("line-prev");
    if (file[currLineIndex - 1]) {
		if( file[currLineIndex - 1] == '\n' )
			lblLinePrev.textContent = '\u00A0';
		else
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
		if( file[currLineIndex + 1] == '\n' )
			lblLineNext.textContent = '\u00A0';
		else
			lblLineNext.textContent = file[currLineIndex + 1];
    }
    else {
        lblLineNext.textContent = "...";
    }

    // update next2 line display
    var lblLineNext2 = document.getElementById("line-next2");
    if (file[currLineIndex + 2]) {
		if( file[currLineIndex + 2] == '\n' )
			lblLineNext2.textContent = '\u00A0';
		else
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