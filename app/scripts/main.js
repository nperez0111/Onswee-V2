function supportsLocalStorage() {
    try {
        return 'localStorage' in window && window.localStorage !== null;
    } catch ( e ) {
        return false;
    }
}

Storage.prototype.setObj = function ( key, value ) {
    this.setItem( key, JSON.stringify( value ) );
};

Storage.prototype.getObj = function ( key ) {
    var value = this.getItem( key );
    return value && JSON.parse( value );
};

function compareNumbers( a, b ) {
        return a[ 0 ] - b[ 0 ];
    }
    //sorting of numbers in array

function compareNumber( a, b ) {
        return a - b;
    }
    //sorting of numbers

Array.prototype.clone = function () {
    return this.slice( 0 );
};

function placePiece( player, num ) {

    if ( game.turns > 5 ) {
        return;
    } else if ( game.board[ num ] !== null ) {
        game.illegal( 'Sorry, that position is taken' );
        return;
    }
    if ( game.justWon ) {
        game.justWon = false;
        return;
    }
    var board = game.board.clone();
    board[ num ] = player;
    if ( game.hasIllegalLineIn( player, board ) ) {
        game.illegal( "Sorry, you can't make a line when placing" );
        return;
    }

    game.placePiece( player, num );

    if ( game.ai ) {
        game.aiTurn();
    }
}

function resetMe() {
    game.illegal( 'Reset Complete!' );
    game.turns = 0;
    localStorage.clear();
    game.justWon = true;
    game.init();
    game.justWon = false;
    ractive.update();
    game.save();
    game.score = [ 0, 0 ];
    game.updateHUD();
}

function setAI() {
        game.ai = $( '#ai' ).is( ':checked' );
        if ( ( game.turns % 2 == 1 ) ) {
            //if is player2 do the ai turn instead
            game.aiTurn();
        }
        settings.set( 'ai', game.ai );
    }
    //provides a clone method for arrays
function setName( player ) {
    var str = $( '#' + ( player ? 'player1' : 'player2' ) ).val();
    settings.set( player ? 'player1' : 'player2', str );
    game.setName( str, player );
}

function select( num ) {
    if ( game.turns < 6 ) {
        return;
    }
    if ( game.dontSelect ) {
        game.dontSelect = false;
        return;
    }
    var snum = game.toInt( ractive.get( 'selected' ) ),
        bool = num === ractive.get( 'moveables' )[ 0 ] || num === ractive.get( 'moveables' )[ 1 ] || num === ractive.get( 'moveables' )[ 2 ];
    if ( snum == num ) {
        //deselect that board position and make those positions un special and set setts.selected to -1
        ractive.set( 'selected', -1 );
        ractive.set( 'moveables', [] );
    } else if ( snum == -1 || !bool ) {
        //is not set so let's set current num to special and possible move locs to activated
        if ( game.board[ num ] == ( game.turns % 2 == 1 ) ) {
            game.illegal( "It's " + game.getName( game.turns % 2 === 0 ) + "'s turn!" );
            return;
        }

        var arr = [];
        for ( var c = 0, all = game.allPosMoveLocs[ num ], cl = all.length; c < cl; c++ ) {
            if ( game.board[ all[ c ] ] === null ) {
                if ( game.turns < 12 && game.hasIllegalLineIn( game.board[ num ], game.hypotheticalMoveInFromTo( game.board[ num ], game.board, num, all[ c ] ) ) ) {

                } else {
                    arr.push( all[ c ] );
                }
            }
        }

        if ( arr.length === 0 ) {
            game.illegal( "Can't make any straight lines in these turns" );
            return;
        }
        ractive.set( 'selected', num );
        ractive.set( 'moveables', arr );

    } else if ( bool ) {
        //move to num if it is one of the move locs

        for ( var co = 0, allo = game.allPosMoveLocs[ snum ], clo = allo.length; co < clo; co++ ) {
            if ( game.board[ allo[ co ] ] === null ) {
                game.moveFromTo( game.board[ snum ], snum, num );
                ractive.set( 'selected', -1 );
                ractive.set( 'moveables', [] );
                if ( game.board == [ null, null, null, null, null, null, null, null, null ] ) {
                    game.justWon = true;
                }
                return;
            }
        }

    }
    game.updateHUD();
    game.justWon = false;

}

function goTo( which, link ) {

    if ( game.which[ 0 ] == which ) {
        return;
    }

    $( game.which[ 0 ] ).slideUp( 'slow' );
    $( which ).slideDown( 'slow' );
    $( link ).addClass( 'active' );
    $( game.which[ 1 ] ).removeClass( 'active' );

    game.which = [ which, link ];

}

function allowDrop( ev ) {
    ev.preventDefault();
}

function whichAmI( ev ) {
    if ( ( game.turns % 2 === 0 ) == game.board[ game.toInt( ev.target.id.replace( /^\D+/g, "" ) ) ] ) {
        ev.dataTransfer.setData( "which", ev.target.id.replace( /^\D+/g, "" ) );
    } else {
        game.illegal( "It's " + game.getName( game.turns % 2 === 0 ) + "'s turn!" );
    }
}

function drop( ev ) {
    ev.preventDefault();
    game.justWon = false;
    if ( ev.dataTransfer.getData( "which" ) ) {
        var drag = game.toInt( ev.dataTransfer.getData( "which" ) ),
            dropp = game.toInt( ev.target.id.replace( /^\D+/g, "" ) );
        game.moveFromTo( game.board[ drag ], drag, dropp );
    }

}

var game = {

    init: function () {
        this.board = [ null, null, null, null, null, null, null, null, null ];
        this.turns = 0;
        this.moves = [];
        if ( !this.justWon && this.load() ) {
            //any post load
        } else {
            if ( !supportsLocalStorage() ) {
                return;
            }
            //any first time code here
        }

    },

    board: [ null, null, null, null, null, null, null, null, null ],
    //9 possible positions Null==Empty, True==Player1, False==Player2
    getEmpties: function () {
        var b = this.board;
        return [ b[ 0 ] !== null, b[ 1 ] !== null, b[ 2 ] !== null, b[ 3 ] !== null, b[ 4 ] !== null, b[ 5 ] !== null, b[ 6 ] !== null, b[ 7 ] !== null, b[ 8 ] !== null ];
    },
    moveFromTo: function ( player, from, to ) {
        if ( this.turns < 12 && this.moveFromToWithRules( player, from, to ) === false ) {
            return false;
        }
        var board = this.board;
        if ( board[ from ] == player && board[ to ] === null ) {
            if ( from == this.center ) {

            } else {
                for ( var i = 0, testMoves = this.illegalMovements[ from ], l = testMoves.length; i < l; i++ ) {
                    if ( testMoves[ i ] == to ) {
                        this.illegal( "Sorry, you can't move there!" );
                        console.log( "Attempted to move from %s to %s with player %s", from, to, player ? 'X' : 'O' );
                        return;
                    }
                }
            }



            this.animateTo( from, to, function ( thi, from, to ) {

                thi.board[ to ] = thi.board[ from ];
                thi.board[ from ] = null;
                thi.turns++;
                thi.storeMoves( from, to );
                console.log( "Successful Movement, From: %s To: %s For %s", from, to, thi.board[ to ] ? 'X' : 'O' );
                thi.trackcurrent( thi.board );
                thi.updateHUD();

                if ( thi.isWinIn( thi.board[ to ], thi.board ) ) {
                    console.log( "%c%s Won!", "color:red;font-size:20px;", thi.getName( player ) );
                    thi.illegal( thi.getName( thi.board[ to ] ) + ' won!' );
                    thi.newGame( thi.board[ to ] );
                } else if ( thi.ai && ( thi.turns % 2 === 1 ) ) {
                    setTimeout( function () {
                        game.aiTurn();
                    }, 2000 );
                }
                thi.save();
            } );

            return;
        } else {
            //Figure out what to do if its an invalid position
            console.log( "Attempted to move from %s to %s with player %s", from, to, player ? 'X' : 'O' );
            this.illegal( "Sorry, you can't move there!" );
        }
    },
    // accepts player interger position from and to on the board and moves if no errors occur
    which: [ '#gameBoard', '.game' ],

    justWon: false,
    // to fix browser eager click post win 

    moveFromToWithRules: function ( player, from, to ) {
        if ( this.hasIllegalLineIn( player, this.hypotheticalMoveInFromTo( player, this.board, from, to ) ) ) {
            this.illegal( "Sorry, during these turns you can't make a line of any kind" );

            return false;
        }
        return true;
    },

    hypotheticalMoveInFromTo: function ( player, board, from, to ) {

        var boardy = board.clone();
        boardy[ from ] = null;
        boardy[ to ] = player;
        return boardy;

    },
    //for the AI when it is in place

    player1Name: "Player 1",
    player2Name: "Player 2",
    dontSelect: false,
    turns: 0,
    //Saves current turn, (turn%2==0) gives current players turn

    getName: function ( player ) {

        return player ? this.player1Name : this.player2Name;

    },
    //returns String, true for P1, False for P2
    choosePlayer: function ( player ) {
        settings.set( 'player', player ? 0 : 1 );
        settings.update();
    },
    setName: function ( str, player ) {
        if ( player ) {
            this.player1Name = str;
        } else {
            this.player2Name = str;
        }
        this.updateHUD();
        this.saveScore( null );
        //reflect Name change to HUD
    },
    icon: [ 'images/x.png', 'images/o.png' ],
    //default icons and who it is set to
    iconPossibles: [ 'images/default3.png', 'images/default4.png', 'images/default5.png', 'images/default6.png', 'images/default7.png', 'images/default8.png' ],
    //these are all of the possible icons to choose from
    getIcon: function ( player ) {
        return this.icon[ player ? 0 : 1 ];
    },
    //returns the location to look for the icon depending on player
    setIcon: function ( player, icon ) {
        if ( ( this.icon[ player ] == this.iconPossibles[ icon ] ) || ( this.icon[ ( player === 0 ? 1 : 0 ) ] == this.iconPossibles[ icon ] ) ) {
            //if the one we are setting it to is the one set or if the one we are setting it to is the other players then just dont set it
            return;
        }
        var tmp = this.icon[ player ]; //stores curicon

        this.icon[ player ] = this.iconPossibles[ icon ]; //sets curicon to newicon

        this.iconPossibles[ icon ] = tmp; //sets new icon to old icon

        tmp = null;
        settings.set( {
            player1: game.player1Name,
            player2: game.player2Name,
            iconPossibles: game.iconPossibles,

        } );
        settings.set( 'player', player === 0 ? 1 : 0 );
        this.updateHUD();
    },
    //sets the location to look for icons
    save: function () {
        //save turn, save current moves, add last board state to moves, save names, save icons, save scores
        if ( !supportsLocalStorage() ) {
            return false;
        }

        localStorage.isPlaying = this.turns > 0 ? true : false;
        //store things if game is in progress
        localStorage.setObj( 'board', game.board );
        localStorage.turn = this.turns;
        localStorage.setObj( 'moves', this.moves );
        localStorage.setObj( 'icons', [ game.icon, game.iconPossibles ] );
        localStorage.ai = this.ai;



    },
    //Saves current state of the game each change that has been made to continue game later
    moves: [],
    //contains all moves within a game for storage and playback on reset, first element contains the initial board on which to apply the moves, moves.length+4 is how many turns passed in the game
    storeMoves: function ( from, to ) {

        this.moves.push( [ from, to ] );

    },
    undo: function () {

        if ( this.moves.length < 2 ) {
            return false;
        }

        var last = this.moves.pop();
        this.turns--;
        this.moveFromTo( this.turns % 2 === 0, last[ 1 ], last[ 0 ] );
        this.save();
        this.updateHUD();

    },
    ai: false,
    //stores if ai is playing or not
    load: function () {
        if ( !supportsLocalStorage() || !( localStorage.isPlaying ) || ( localStorage.isPlaying == 'false' ) ) {
            return false;
        }
        this.ai = ( localStorage.ai == 'true' );
        this.board = localStorage.getObj( 'board' );
        this.turns = this.toInt( localStorage.turn );
        this.moves = localStorage.getObj( 'moves' );
        this.icon = localStorage.getObj( 'icons' ) ? localStorage.getObj( 'icons' )[ 0 ] : this.icon;
        this.iconPossibles = localStorage.getObj( 'icons' ) ? localStorage.getObj( 'icons' )[ 1 ] : this.iconPossibles;
        this.score = localStorage.getObj( 'score' ) ? localStorage.getObj( 'score' ) : [ 0, 0 ];
        var players = localStorage.getObj( 'players' );
        if ( players !== null ) {
            this.player1Name = players[ 0 ];
            this.player2Name = players[ 1 ];
        }
        return true;

    },
    //loads last game played at last saved positions


    animateTo: function ( from, to, callback ) {
        var distanceX = this.toInt( to % 3 ) - this.toInt( from % 3 ),
            distanceY = this.toInt( to / 3 ) - this.toInt( from / 3 ),
            el = '#drag' + from;
        $( el ).css( 'position', 'relative' );

        //this is for ripplelink
        $( "#drop" + from ).removeClass( 'overHide' ).addClass( 'overShow' );

        $( el ).animate( {
            left: ( distanceX * $( '.boardPlaceHolder' ).outerWidth() + 'px' ),
            top: ( distanceY * $( '.boardPlaceHolder' ).outerHeight() + 'px' )
        }, {
            duration: 1000,
            complete: function () {
                callback( game, from, to );
            }
        } );

    },
    updateHUD: function () {

        if ( this.turns == 4 && this.score == [ 0, 0 ] ) {
            this.illegal( "Remember: You can't place in a line yet!" );
        } else if ( this.turns == 6 && this.score == [ 0, 0 ] ) {
            this.illegal( "Remember: You can't make any straight lines yet!" );
        } else if ( this.turns == 12 ) {
            this.illegal( "You can make lines!" );
        }

        this.trackcurrent( this.board );
        ractive.update();
        settings.update();
        settings.set( {
            player1: game.player1Name,
            player2: game.player2Name
        } );

        ractive.set( {
            board: game.board,
            turn: game.turns > 5,
            turns: game.turns,
            player1: game.player1Name,
            player2: game.player2Name,
            icon: game.icon,
            score: game.score

        } );

        dragAndDrop();

    },
    //updates HUD to current values

    score: [ 0, 0 ],
    //scores of the two players

    saveScore: function ( player ) {
        if ( player !== null ) {
            this.score[ player ? 0 : 1 ] += 1;
            localStorage.setObj( 'score', this.score );
        }
        console.log( 'called save score' );
        //saves scores into score array
        ractive.update( 'score' );
        if ( !supportsLocalStorage() ) {
            return;
        }
        var arr = [ game.player1Name, game.player2Name, game.score ];
        if ( localStorage.getObj( 'players' ) === null ) {
            localStorage.setObj( 'players', arr );
        } else {
            var players = localStorage.getObj( 'players' );
            for ( var i = 0, l = players.length, fl = this.player1Name.length, sl = this.player2Name.length; i < l; i += 3 ) {
                if ( players[ i ] == this.player1Name && players[ i + 1 ] == this.player2Name ) {
                    players[ i + 2 ][ player ? 0 : 1 ] += player === null ? 0 : 1;
                    localStorage.setObj( 'players', players );
                    return;
                } else if ( Math.abs( players[ i ].length - fl ) == 1 ) {
                    if ( players[ i ] == this.player1Name.slice( 0, players[ i ].length ) || players[ i ].slice( 0, fl ) == this.player1Name ) {
                        players[ i ] = this.player1Name;
                        localStorage.setObj( 'players', players );
                        return;

                    }
                } else if ( Math.abs( players[ i + 1 ].length - sl ) == 1 ) {
                    if ( players[ i + 1 ] == this.player2Name.slice( 0, players[ i + 1 ].length ) || players[ i + 1 ].slice( 0, sl ) == this.player2Name ) {
                        players[ i + 1 ] = this.player2Name;
                        localStorage.setObj( 'players', players );
                        return;
                    }
                }
            }
            localStorage.setObj( 'players', arr.concat( localStorage.getObj( 'players' ) ) );
        }
        localStorage.isPlaying = ( player !== null );
    },

    newGame: function ( player ) {
        this.saveScore( player );
        game.justWon = true;
        this.init();
        game.justWon = false;
        this.updateHUD();
    },
    //Resets all settings to default and updates HUd to reflect a wiped game

    animationIsGoing: false,
    //to prevent browser eagerclick

    illegal: function ( errorMsg ) {
        if ( this.animationIsGoing ) {
            return;
        }
        this.animationIsGoing = true;
        console.log( errorMsg );

        $( '#messageArea' ).text( errorMsg );
        $( '#messageArea' ).show( 'size', {}, 800, function () {
            $( '#messageArea' ).delay( 1900 ).hide( 'drop', {}, 1000, function () {
                $( '#messageArea' ).text( '' );
                game.animationIsGoing = false;
            } );

        } );
    },
    //something illegal happened

    illegalMovements: [
        [ 2, 5, 6, 7, 8 ],
        [ 3, 5, 6, 7, 8 ],
        [ 0, 3, 6, 7, 8 ],
        [ 1, 2, 5, 7, 8 ],
        [],
        [ 0, 1, 3, 6, 7 ],
        [ 0, 1, 2, 5, 8 ],
        [ 0, 1, 2, 3, 5 ],
        [ 0, 1, 2, 3, 6 ]
    ],
    //All Impossible movements by index

    winningArrangements: [
        [ 0, 4, 8 ],
        [ 1, 4, 7 ],
        [ 2, 4, 6 ],
        [ 3, 4, 5 ]
    ],
    //All possible Winning arangements to check against

    illegalArrangements: [
        [ 0, 3, 6 ],
        [ 2, 5, 8 ],
        [ 0, 1, 2 ],
        [ 6, 7, 8 ]
    ],
    //These arrangements including winningArrangements are illegal in rounds 6-12 if these are encountered the other player wins and a notification as to why is given

    allPosMoveLocs: [
        [ 1, 3, 4 ],
        [ 0, 2, 4 ],
        [ 1, 4, 5 ],
        [ 0, 4, 6 ],
        [ 0, 1, 2, 3, 5, 6, 7, 8 ],
        [ 2, 4, 8 ],
        [ 3, 4, 7 ],
        [ 4, 6, 8 ],
        [ 4, 5, 7 ]
    ],
    //for the index inputted into this array all pssible locations for that position on the corresponding space on the board is given

    corners: [ 0, 2, 6, 8 ],
    //Self explanatory

    edges: [ 1, 3, 5, 7 ],
    //includes corners

    center: 4,
    //center being the best position to have when playing

    pairArrangements: [
        [ 0, 8 ],
        [ 1, 7 ],
        [ 2, 6 ],
        [ 3, 5 ],
        [ 0, 4 ],
        [ 4, 8 ],
        [ 1, 4 ],
        [ 4, 7 ],
        [ 2, 4 ],
        [ 4, 6 ],
        [ 3, 4 ],
        [ 4, 5 ]
    ],
    //no specific order, go through this and if any of these match try to check with next

    pairCompleter: [
        [ 1, 2, 3, 5, 6, 7 ],
        [ 0, 2, 3, 5, 6, 8 ],
        [ 0, 1, 3, 5, 7, 8 ],
        [ 0, 1, 2, 6, 7, 8 ],
        [ 5, 7 ],
        [ 1, 3 ],
        [ 6, 8 ],
        [ 0, 2 ],
        [ 3, 7 ],
        [ 1, 5 ],
        [ 2, 8 ],
        [ 0, 6 ]
    ],
    //corresponding to previos pairArrangements var these are the positions to check to see if it can make a line through center

    prefferedLocs: [ 0, 2, 6, 8, 3, 1, 7, 5 ],
    //preffered locations for placing into board 4 is checked seperately

    trapArrangements: [
        [
            [ 0, 2, 4 ],
            [ 1, 3, 5 ]
        ],
        [
            [ 0, 4, 6 ],
            [ 1, 3, 7 ]
        ],
        [
            [ 2, 4, 8 ],
            [ 1, 5, 7 ]
        ],
        [
            [ 4, 6, 8 ],
            [ 3, 5, 7 ]
        ], //end of edge traps
        [

            [ 1, 4, 5 ],
            [ 0, 2, 8 ]

        ],
        [

            [ 3, 4, 7 ],
            [ 0, 6, 8 ]
        ],
        [

            [ 0, 2, 6 ],
            [ 1, 3, 4 ]
        ],
        [

            [ 4, 5, 7 ],
            [ 2, 6, 8 ]
        ], //end of corner traps
        [
            [ 1, 2, 3 ],
            [ 0, 4, 5 ]
        ],
        [
            [ 0, 4, 5 ],
            [ 1, 2, 3 ]
        ],
        [
            [ 0, 1, 5 ],
            [ 2, 3, 4 ]
        ],
        [
            [ 2, 3, 4 ],
            [ 0, 1, 5 ]
        ],
        [
            [ 1, 5, 8 ],
            [ 2, 4, 7 ]
        ],
        [
            [ 2, 4, 7 ],
            [ 1, 5, 8 ]
        ],
        [
            [ 2, 5, 7 ],
            [ 1, 4, 8 ]
        ],
        [
            [ 1, 4, 8 ],
            [ 2, 5, 7 ]
        ],
        [
            [ 3, 4, 8 ],
            [ 5, 6, 7 ]
        ],
        [
            [ 5, 6, 7 ],
            [ 3, 4, 8 ]
        ],
        [
            [ 4, 5, 6 ],
            [ 3, 7, 8 ]
        ],
        [
            [ 3, 7, 8 ],
            [ 4, 5, 6 ]
        ],
        [
            [ 0, 4, 7 ],
            [ 2, 3, 6 ]
        ],
        [
            [ 2, 3, 6 ],
            [ 0, 4, 7 ]
        ],
        [
            [ 1, 4, 6 ],
            [ 0, 3, 7 ]
        ],
        [
            [ 0, 3, 7 ],
            [ 1, 4, 6 ]
        ] //end of side traps
    ],
    //arrangements for trapping [0] is the other player who needs to move [1] is player checking

    ifCanTrap: function ( player, board ) {
        var myplayer = this.findPlayersPosIn( player, board ).sort( compareNumber ),
            myOpponent = this.findPlayersPosIn( !player, board ).sort( compareNumber );

        for ( var r = this.trapArrangements.length - 1; r--; ) {
            var to = this.twoOutOfThree( this.trapArrangements[ r ][ 1 ], myplayer );

            if ( to > -1 && this.arraysEqual( this.trapArrangements[ r ][ 0 ], myOpponent ) ) {


                for ( var c = this.allPosMoveLocs[ to ].length - 1; c--; ) {
                    if ( board[ this.allPosMoveLocs[ to ][ c ] ] == player ) {

                        return [ this.allPosMoveLocs[ to ][ c ], to ];
                    }
                }

            }

        }
        return null;
    },
    //tests if the player can trap the other player within a board
    arraysEqual: function ( arr1, arr2 ) {
        if ( arr1.length !== arr2.length ) {
            return false;
        }
        for ( var i = arr1.length; i--; ) {
            if ( arr1[ i ] !== arr2[ i ] ) {
                return false;
            }
        }

        return true;
    },
    //if two arrays are equal returns true
    twoOutOfThree: function ( arr1, arr2 ) {
        var count = 0,
            c = 0;
        for ( var i = arr1.length; i--; ) {
            if ( arr1[ i ] !== arr2[ i ] ) {
                count++;
                c = i;
            }
        }

        return count == 1 ? arr1[ c ] : -1;
    },
    //if two arrays are equal returns true
    choosePreffered: function ( player, board ) {
        if ( board[ this.center ] === null ) {
            return this.center;
        }
        var arr = [];
        for ( var i = 8; i--; ) {
            var bcopy = board.clone();
            bcopy[ i ] = player;
            if ( board[ i ] === null && ( this.turns < 4 || !this.hasIllegalLineIn( player, bcopy ) ) ) {
                arr.push( i );
            }
        }

        return arr[ this.toInt( Math.random() * arr.length ) ];
    },
    //chooses preffered location randomly returns integer position of empty space to put into
    toInt: function ( inter ) {
        return parseInt( inter, 10 );
    },
    //converts to int

    hasPossibleLineIn: function ( player, board ) {
        if ( this.hasCenterIn( player, board ) ) {
            var pos = this.findPlayersPosIn( player, board );
            for ( var i = 0, l = pos.length; i < l; i++ ) {
                if ( pos[ i ] !== this.center ) {
                    for ( var val = 4, lval = this.pairArrangements.length; val < lval; val++ ) {
                        if ( board[ this.pairArrangements[ val ][ 0 ] ] == player && board[ this.pairArrangements[ val ][ 1 ] ] == player ) {
                            if ( val % 2 === 0 ) {
                                if ( board[ this.pairArrangements[ val + 1 ][ 1 ] ] === null ) {
                                    return val;
                                }
                            } else {
                                if ( board[ this.pairArrangements[ val - 1 ][ 0 ] ] === null ) {
                                    return val;
                                }
                            }
                        }
                    }
                }
            }

        }

        for ( var il = 0, p = this.pairArrangements, b = board, le = p.length; il < le; il++ ) {

            if ( b[ p[ il ][ 0 ] ] == player && b[ p[ il ][ 1 ] ] == player ) {
                //board positions value==player continue to check next
                return il;
            }

        }
        return 12;
    },
    //player is player board is in what board, returns the index at which the pairArrangment is found or 12 if none is found if the player being questioned has two in a line on the board

    hasCenterIn: function ( player, board ) {
        return player == board[ this.center ];
    },
    //returns true if specified player has the center of specified board

    isWinIn: function ( player, board ) {

        var pos = this.findPlayersPosIn( player, board ).sort( compareNumber );

        if ( pos[ 0 ] > 3 ) {
            return false;
        }

        var cur = this.winningArrangements[ pos[ 0 ] ];

        if ( cur[ 1 ] == pos[ 1 ] && cur[ 2 ] == pos[ 2 ] ) {
            return true;
        }
        return false;

    },
    //returns true if specified player has a line through the center in the specified board

    hasIllegalLineIn: function ( player, board ) {
        if ( this.turns > 12 ) {
            return false;
        }
        for ( var i = 0, b = board, line = this.winningArrangements.concat( this.illegalArrangements ), l = line.length; i < l; i++ ) {
            if ( b[ line[ i ][ 0 ] ] == player && b[ line[ i ][ 1 ] ] == player && b[ line[ i ][ 2 ] ] == player ) {
                return true;
            }
        }

        return false;
    },

    canCompleteALineIn: function ( player, board ) {

        var pairArrOutPut = this.hasPossibleLineIn( player, board );

        if ( pairArrOutPut == 12 ) {
            return false;
        } else if ( board[ this.center ] === null && ( pairArrOutPut < 4 ) ) {
            return true;
        } else if ( pairArrOutPut > 3 && ( board[ this.pairCompleter[ pairArrOutPut ][ 0 ] ] == player || board[ this.pairCompleter[ pairArrOutPut ][ 1 ] ] == player ) && board[ this.pairArrangements[ ( pairArrOutPut % 2 ) === 0 ? pairArrOutPut + 1 : pairArrOutPut - 1 ][ ( pairArrOutPut % 2 ) === 0 ? 1 : 0 ] ] === null ) {

            return true;
        }
        return false;
    },
    //returns true if the specified player can complete a line with in the given board in one move
    completeLineIn: function ( player, board ) {
        var pairArrOutPut = this.hasPossibleLineIn( player, board );

        var possibles = this.findPlayersPosIn( player, board );
        for ( var i = 0, l = possibles.length; i < l; i++ ) {
            if ( possibles[ i ] !== this.pairArrangements[ pairArrOutPut ][ 0 ] && possibles[ i ] !== this.pairArrangements[ pairArrOutPut ][ 1 ] ) {
                if ( board[ this.center ] === null && ( pairArrOutPut < 4 ) ) {
                    this.moveFromTo( player, possibles[ i ], this.center );
                    this.turns = 0;
                    return;
                }

                this.moveFromTo( player, possibles[ i ], this.pairArrangements[ ( pairArrOutPut % 2 ) === 0 ? pairArrOutPut + 1 : pairArrOutPut - 1 ][ ( pairArrOutPut % 2 ) === 0 ? 1 : 0 ] );
                this.turns = 0;
                return;

            }
        }

    },
    completeLineAgainst: function ( player, board ) {
        var pairArrOutPut = this.hasPossibleLineIn( !player, board );
        //console.log("Output is at %s", pairArrOutPut);
        if ( pairArrOutPut < 4 ) {
            //console.log("Focus on center");
            //steal center
            if ( board[ this.center ] === null ) {
                var positions = this.findPlayersPosIn( player, board );
                for ( var i = 0, l = positions.length; i < l; i++ ) {
                    if ( this.hasPossibleLineIn( player, this.hypotheticalMoveInFromTo( player, board, positions[ i ], this.center ) ) ) {
                        this.moveFromTo( player, positions[ i ], this.center );
                        return true;
                    }
                }
                this.moveFromTo( player, positions[ 2 ], this.center );
                return true;
            }
        } //console.log("Guess it wasn't in the center");
        if ( board[ this.pairCompleter[ pairArrOutPut ][ 0 ] ] == player || board[ this.pairCompleter[ pairArrOutPut ][ 1 ] ] == player ) {
            //console.log("From %s to %s Please",board[this.pairCompleter[pairArrOutPut][0]]==player?this.pairCompleter[pairArrOutPut][0]:this.pairCompleter[pairArrOutPut][1],this.pairArrangements[(pairArrOutPut%2)===0?pairArrOutPut+1:pairArrOutPut-1][(pairArrOutPut%2)===0?1:0]);

            this.moveFromTo( player, board[ this.pairCompleter[ pairArrOutPut ][ 0 ] ] == player ? this.pairCompleter[ pairArrOutPut ][ 0 ] : this.pairCompleter[ pairArrOutPut ][ 1 ], this.pairArrangements[ ( pairArrOutPut % 2 ) === 0 ? pairArrOutPut + 1 : pairArrOutPut - 1 ][ ( pairArrOutPut % 2 ) === 0 ? 1 : 0 ] );
            return true;
        }
        return false;
    },
    canMoveInTo: function ( player, board, pos ) {
        if ( pos == this.center && board[ this.center ] === null ) {
            return true;
        }

        if ( board[ pos ] === null ) {

            for ( var i = 0, possibleLocs = this.allPosMoveLocs[ pos ], l = possibleLocs.length, aboard = board; i < l; i++ ) {

                if ( aboard[ possibleLocs[ i ] ] == player ) {
                    return true;
                }

            }
        }

        return false;

    },
    //returns true if player can move into a loc within a board
    findPlayersPosIn: function ( player, board ) {
        var arr = [],
            c = 0;
        for ( var i = 0, aboard = board, l = aboard.length; i < l; i++ ) {
            if ( aboard[ i ] == player ) {
                arr[ c ] = i;
                c++;
            }
        }
        return arr;
    },
    //returns where the players pieces are located within a board

    canMoveFromTo: function ( player, board, from, to ) {
        if ( board[ to ] === null && board[ from ] == player && ( from == this.center || this.allPosMoveLocs[ from ][ 0 ] == to || this.allPosMoveLocs[ from ][ 1 ] == to || this.allPosMoveLocs[ from ][ 2 ] == to ) ) {
            return true;
        }
        return false;
    },
    //returns true if player in board can move from pos to pos

    changeBetween: function ( prev, newy ) {
        var re = [];
        for ( var p = 0, pl = prev.length; p < pl; p++ ) {

            if ( prev[ p ] === null && prev[ p ] !== newy[ p ] ) {
                re[ 1 ] = p;
            }
            if ( prev[ p ] !== null && prev[ p ] !== newy[ p ] ) {
                re[ 0 ] = p;
            }

        }
        return re;
    },
    //returns the changebetween two boards returned in format [from,to]

    getPossibleBoardArrangementsFrom: function ( player, board ) {
        var arr = [];
        for ( var i = 0, piecesPos = this.findPlayersPosIn( player, board ), l = piecesPos.length; i < l; i++ ) {

            for ( var m = 0, moveLocs = this.allPosMoveLocs[ piecesPos[ i ] ], length = moveLocs.length; m < length; m++ ) {
                if ( this.canMoveFromTo( player, board, piecesPos[ i ], moveLocs[ m ] ) ) {
                    var curBoard = this.hypotheticalMoveInFromTo( player, board, piecesPos[ i ], moveLocs[ m ] );
                    //this.trackcurrent(curBoard);
                    arr.push( curBoard );
                }
            }

        }
        return arr;

    },
    //returns an array of possible board arrangements

    rankBoard: function ( player, board ) {
        var rank = 0;
        if ( this.canCompleteALineIn( player, board ) ) {
            rank += 50;
        }
        if ( this.canCompleteALineIn( !player, board ) ) {
            rank -= 400;
        }
        if ( this.isWinIn( player, board ) ) {
            rank += 400;
        }
        if ( this.isWinIn( !player, board ) ) {
            rank -= 200;
        }
        if ( this.hasPossibleLineIn( player, board ) !== 12 ) {
            rank += 10;
        }
        if ( this.hasPossibleLineIn( !player, board ) !== 12 ) {
            rank -= 10;
        }
        if ( this.hasCenterIn( player, board ) ) {
            rank += 15;
        }
        if ( this.hasCenterIn( !player, board ) ) {
            rank -= 10;
        }
        if ( this.ifCanTrap( player, board ) !== null ) {
            rank += 200;
        }
        if ( this.ifCanTrap( !player, board ) !== null ) {
            rank -= 125;
        }
        //this.trackcurrent(board);
        //console.log("Rank of: "+rank+", For: "+this.getName(player)+" As: "+(player?'X':'O'));
        return rank;
    },
    //ranks board arrangement returns an interger logs rank to console
    trackcurrent: function ( board ) {
        var bro = "",
            brt = "",
            br = "";
        for ( var i = 0, l = board.length; i < l; i++ ) {
            if ( i / 3 < 1 ) {
                bro += board[ i ] ? ' X ' : board[ i ] === null ? ' ' + i + ' ' : ' O ';
            } else if ( i / 3 < 2 ) {
                brt += board[ i ] ? ' X ' : board[ i ] === null ? ' ' + i + ' ' : ' O ';
            } else {
                br += board[ i ] ? ' X ' : board[ i ] === null ? ' ' + i + ' ' : ' O ';
            }
        }
        console.log( '---------' );
        console.log( bro );
        console.log( brt );
        console.log( br );
        console.log( '---------' );
    },
    //logs current board to console
    placePiece: function ( player, pos ) {
        if ( this.turns > 5 ) {
            return false;
        }
        if ( this.board[ pos ] === null && ( this.hasIllegalLineIn( player, this.hypotheticalMoveInFromTo( player, this.board.clone(), pos, pos ) ) === false ) ) {
            this.board[ pos ] = player;
            this.turns++;
            this.updateHUD();
            if ( this.turns == 5 ) {
                this.moves[ 0 ] = this.board;
            }
            this.save();
            return true;
        }
        this.illegal( "Sorry that space is filled!" );
        return false;
    },
    //places Piece in Board if possible
    aiTurn: function () {
        console.log( '----------------AI Turn' );
        if ( this.turns > 5 ) {

            this.chooseBestMove( false, this.board );

        } else {
            this.placePiece( false, this.choosePreffered( false, this.board ) );
        }
        this.updateHUD();
        console.log( '-------------------End AI turn' );
    },
    //AI's turn invoked after the user does their turn
    chooseBestMove: function ( player, board ) {
        var bool = this.turns > 11,
            canTrap = this.ifCanTrap( player, board );
        if ( bool && this.canCompleteALineIn( player, board ) ) {
            //complete the line then!
            console.log( "Let's Complete A line!" );
            this.completeLineIn( player, board );
            return;
        } else if ( bool && this.canCompleteALineIn( !player, board ) ) {
            //block that!!
            console.log( "Let's try to block em!" );
            if ( this.completeLineAgainst( player, board ) ) {
                console.log( "We Blocked them!" );
                return;
            }
            console.log( "I think we may Lose that next turn :(" );
        } else if ( bool && canTrap !== null ) {
            this.moveFromTo( player, canTrap[ 0 ], canTrap[ 1 ] );
            return;
        }

        var InitialMovesPossible = this.trimArrangements( player, this.getPossibleBoardArrangementsFrom( player, this.board ) ),
            OpponentsPossibleMoves = [],
            playersFutureMoves = [],
            initialMoveRankings = [],
            opponentMoveRankings = [],
            futureMoveRankings = [];

        if ( InitialMovesPossible.length === 0 ) {
            this.moveIntoAnyOpenPos( player );
            console.log( "Welp We Lost :(" );
            return;

        } else if ( InitialMovesPossible.length == 1 ) {

            //just skip we will move into that position that is possible now
            console.log( "Only one position to move to really :/" );

        } else {

            for ( var first = 0, firstLength = InitialMovesPossible.length; first < firstLength; first++ ) {
                //console.log("Working the first round for the %s time",first+1);
                //goes through first set


                OpponentsPossibleMoves.push( this.getPossibleBoardArrangementsFrom( !player, InitialMovesPossible[ first ] ) );

                //console.log("Calculated and stored OpponentsPossibleMoves");

                initialMoveRankings.push( [ this.rankBoard( player, InitialMovesPossible[ first ] ), first ] );

                //console.log("Storing first rank for the %s time!",first);


                for ( var second = 0, secondLength = OpponentsPossibleMoves[ first ].length; second < secondLength; second++ ) {


                    //console.log("Looking through second possiblities for the %s time the length is %s",second, secondLength);
                    playersFutureMoves.push( this.trimArrangements( player, this.getPossibleBoardArrangementsFrom( player, OpponentsPossibleMoves[ first ][ second ] ) ) );

                    //console.log("Calculated and stored possibilities of Player for the %s time!",second);

                    opponentMoveRankings.push( [ this.rankBoard( !player, OpponentsPossibleMoves[ first ][ second ] ), first ] );

                    //console.log("Stored second rank at %s and %s",first,second);

                    for ( var third = 0, thirdLength = playersFutureMoves[ second ].length; third < thirdLength; third++ ) {
                        futureMoveRankings.push( [ this.rankBoard( player, playersFutureMoves[ second ][ third ] ), first ] );
                        //console.log("Stored third rank at %s and %s and %s, with %s to go",first,second,third,thirdLength-third-1);


                    }


                }


            }
            //console.log("We made it through that madness!!");
        }

        var
        /*AverageOfInitialMoves = this.averageArr(initialMoveRankings),
                    save = this.averageArr(opponentMoveRankings),*/
            sortedRanks = initialMoveRankings.clone().sort( compareNumbers ),
            sec = opponentMoveRankings.clone().sort( compareNumbers ),
            change = [];



        if ( InitialMovesPossible.length > 1 && ( sortedRanks[ sortedRanks.length - 1 ][ 0 ] ) > 0 ) {

            //benefits the AI to Play for itself
            var firstBestMove = sortedRanks[ sortedRanks.length - 1 ][ 1 ];
            var secondBestMove = sortedRanks[ sortedRanks.length - 2 ][ 1 ];


            if ( this.findBestAverage( firstBestMove, futureMoveRankings ) > this.findBestAverage( secondBestMove, futureMoveRankings ) ) {
                change = this.changeBetween( this.board, InitialMovesPossible[ firstBestMove ] );

            } else {
                change = this.changeBetween( this.board, InitialMovesPossible[ secondBestMove ] );
            }


        } else if ( InitialMovesPossible.length == 1 ) {
            change = this.changeBetween( this.board, InitialMovesPossible[ 0 ] );
        } else {
            //screw the player
            console.log( "Let's screw e'm up!" );
            //console.log(opponentMoveRankings);
            //console.log(sec);

            var worstPlayForOpponent = this.findInArrOfArrs( sec[ 0 ][ 0 ], opponentMoveRankings );
            var secondWorstPlayForOp = this.findInArrOfArrs( sec[ 1 ][ 0 ], opponentMoveRankings );


            //console.log("Worst Play is at %s with a ranking of %s and board config ",worstPlayForOpponent,initialMoveRankings[worstPlayForOpponent][0]);
            //this.trackcurrent(InitialMovesPossible[worstPlayForOpponent]);

            //console.log("Compared To:");

            //console.log("Second Worst Play is at %s with a ranking of %s and board config ",secondWorstPlayForOp,initialMoveRankings[secondWorstPlayForOp][0]);
            //this.trackcurrent(InitialMovesPossible[secondWorstPlayForOp]);

            change = initialMoveRankings[ worstPlayForOpponent ][ 0 ] > initialMoveRankings[ secondWorstPlayForOp ][ 0 ] ? this.changeBetween( this.board, InitialMovesPossible[ worstPlayForOpponent ] ) : this.changeBetween( this.board, InitialMovesPossible[ secondWorstPlayForOp ] );
            //console.log(change);
            //console.log("Lets do that move!");


        }
        this.moveFromTo( player, change[ 0 ], change[ 1 ] );

    },
    //chooses Best Location to move to for a player
    trimArrangements: function ( player, board ) {
        var bool = this.turns < 12;
        board.filter( function ( cur ) {
            if ( this.canCompleteALineIn( !player, cur ) || ( bool && this.hasIllegalLineIn( player, cur ) ) || this.isSameMoveAsLastTime( player, cur ) ) {
                return false;
            }
            return true;
        } );
    },
    //trims down unneccesary arrangements
    isSameMoveAsLastTime: function ( player, board ) {
        var moves = this.moves,
            l = moves.length - 2,
            change = this.changeBetween( this.board, board );
        if ( l < 7 ) {
            return false;
        }
        if ( moves[ l ][ 0 ] == change[ 1 ] && moves[ l ][ 1 ] == change[ 0 ] ) {
            return true;
        }
        return false;
    },
    findBestAverage: function ( choiceInFirstRound, thirdRoundArr ) {
        var c = 0,
            b = 0;
        return this.averageArr( thirdRoundArr.filter( function ( cur ) {
            return cur[ 1 ] == choiceInFirstRound;
        } ) );
    },
    averageArr: function ( arr ) {
        return this.toInt( arr.reduce( function ( prev, cur, i, arr ) {
            return prev + cur[ 0 ];
        }, 0 ) / arr.length );
    },
    //averages ranks for choose best move
    moveIntoAnyOpenPos: function ( player ) {
        console.log( 'move into any open spot called' );
        var possibles = this.findPlayersPosIn( player, this.board );

        for ( var i = 0; i < possibles.length; i++ ) {

            if ( this.board[ this.allPosMoveLocs[ possibles[ i ] ][ 0 ] ] === null && !this.hasIllegalLineIn( player, this.hypotheticalMoveInFromTo( player, this.board, possibles[ i ], this.allPosMoveLocs[ possibles[ i ] ][ 0 ] ) ) ) {
                this.moveFromTo( player, possibles[ i ], this.allPosMoveLocs[ possibles[ i ] ][ 0 ] );
                return;
            }
            if ( this.board[ this.allPosMoveLocs[ possibles[ i ] ][ 1 ] ] === null && !this.hasIllegalLineIn( player, this.hypotheticalMoveInFromTo( player, this.board, possibles[ i ], this.allPosMoveLocs[ possibles[ i ] ][ 1 ] ) ) ) {
                this.moveFromTo( player, possibles[ i ], this.allPosMoveLocs[ possibles[ i ] ][ 1 ] );
                return;
            }
            if ( this.board[ this.allPosMoveLocs[ possibles[ i ] ][ 2 ] ] === null && !this.hasIllegalLineIn( player, this.hypotheticalMoveInFromTo( player, this.board, possibles[ i ], this.allPosMoveLocs[ possibles[ i ] ][ 2 ] ) ) ) {
                this.moveFromTo( player, possibles[ i ], this.allPosMoveLocs[ possibles[ i ] ][ 2 ] );
                return;
            }

        }
        if ( this.board[ this.allPosMoveLocs[ 4 ][ 3 ] ] === null && !this.hasIllegalLineIn( player, this.hypotheticalMoveInFromTo( player, this.board, 4, 3 ) ) ) {
            this.moveFromTo( player, 4, this.allPosMoveLocs[ 4 ][ 3 ] );
            return;
        } else if ( this.board[ this.allPosMoveLocs[ 4 ][ 4 ] ] === null && !this.hasIllegalLineIn( player, this.hypotheticalMoveInFromTo( player, this.board, 4, 4 ) ) ) {
            this.moveFromTo( player, 4, this.allPosMoveLocs[ 4 ][ 4 ] );
            return;
        } else if ( this.board[ this.allPosMoveLocs[ 4 ][ 5 ] ] === null && !this.hasIllegalLineIn( player, this.hypotheticalMoveInFromTo( player, this.board, 4, 5 ) ) ) {
            this.moveFromTo( player, 4, this.allPosMoveLocs[ 4 ][ 5 ] );
            return;
        } else if ( this.board[ this.allPosMoveLocs[ 4 ][ 6 ] ] === null && !this.hasIllegalLineIn( player, this.hypotheticalMoveInFromTo( player, this.board, 4, 6 ) ) ) {
            this.moveFromTo( player, 4, this.allPosMoveLocs[ 4 ][ 6 ] );
            return;
        } else if ( this.board[ this.allPosMoveLocs[ 4 ][ 7 ] ] === null && !this.hasIllegalLineIn( player, this.hypotheticalMoveInFromTo( player, this.board, 4, 7 ) ) ) {
            this.moveFromTo( player, 4, this.allPosMoveLocs[ 4 ][ 7 ] );
            return;
        } else if ( this.board[ this.allPosMoveLocs[ 4 ][ 8 ] ] === null && !this.hasIllegalLineIn( player, this.hypotheticalMoveInFromTo( player, this.board, 4, 8 ) ) ) {
            this.moveFromTo( player, 4, this.allPosMoveLocs[ 4 ][ 8 ] );
            return;
        } else {
            console.log( 'Error: No open position found or something is really messed up!' );
        }

    },
    findInArrOfArrs: function ( num, arr ) {
        var ret = arr.filter( function ( cur, i ) {
            return cur[ 0 ] == num
        } )[ 0 ];
        return ret ? ret[ 1 ] : ret;
    }
};
var ractive, settings;

function buildractive() {
    ractive = new Ractive( {
        el: 'gameBoard',
        template: '#template',
        data: {
            board: game.board,
            turn: game.turns > 5,
            turns: game.turns,
            player1: game.player1Name,
            player2: game.player2Name,
            icon: game.icon,
            player: 0,
            moveables: [],
            selected: -1,
            score: game.score,
            isActive: function ( num ) {
                return this.get( 'moveables' ).filter( function ( cur ) {
                    return cur == num;
                } ).length > 0;

            }


        }
    } );
    settings = new Ractive( {
        el: 'settingsPage',
        template: '#settings',
        data: {
            player1: game.player1Name,
            player2: game.player2Name,
            icon: game.icon,
            iconPossibles: game.iconPossibles,
            player: 0,
            ai: game.ai,
        }
    } );
    settings.observe( 'player1', function ( newValue, oldValue ) {
        game.setName( newValue, true );
        settings.set( 'player1', newValue );
        settings.update();
    } );
    settings.observe( 'player2', function ( newValue, oldValue ) {
        game.setName( newValue, false );
        settings.set( 'player2', newValue );
        settings.update();
    } );
}

function dragAndDrop() {
    var hadnt = true;
    $( '.draggable' ).draggable( {
        containment: $( '#gameBoard' ),
        cursor: "pointer",
        opacity: 0.8,
        revert: function ( dropped ) {
            //if it is not the players turn then send the draggable to where it was
            if ( ( game.board[ game.toInt( $( this ).attr( 'id' ).replace( /^\D+/g, "" ) ) ] !== null ) || !dropped ) {
                game.dontSelect = ( game.board[ game.toInt( $( this ).attr( 'id' ).replace( /^\D+/g, "" ) ) ] !== null );
                return true;
            }

            return false;
        },
        revertDuration: 1000,
        delay: 200,
        zIndex: 120,
        drag: function ( event, ui ) {
            if ( hadnt ) {
                $( this ).parent().parent().removeClass( 'overHide' );
                hadnt = false;
                if ( ractive.get( 'selected' ) > -1 ) {
                    $( this ).removeClass( 'Active' );
                    ractive.set( 'selected', -1 );
                    ractive.set( 'moveables', [] );
                }
            }

        }
    } );

    $( ".drop" ).droppable( {

        accept: ".draggable",
        tolerance: "pointer",
        drop: function ( event, ui ) {
            var dropNum = game.toInt( $( this ).attr( 'id' ).replace( /^\D+/g, "" ) ),
                dragNum = game.toInt( $( ui.draggable ).attr( 'id' ).replace( /^\D+/g, "" ) );
            $( this ).removeClass( 'Active' );
            if ( ( game.turns % 2 === 0 ) !== game.board[ dragNum ] ) {
                game.illegal( "Sorry " + game.getName( game.board[ dragNum ] ) + ", it's " + game.getName( !game.board[ dragNum ] ) + "'s turn!" );
                return false;
            } else if ( dragNum == dropNum ) {
                return false;
            } else if ( game.board[ dropNum ] !== null ) {
                //Something there
                game.illegal( 'Something already there!' );
                return false;

            } else if ( !game.canMoveFromTo( game.board[ dragNum ], game.board.clone(), dragNum, dropNum ) ) {

                game.illegal( "Sorry that's too far to move to!" );
                return false;

            } else {

                game.moveFromTo( game.turns % 2 === 0, dragNum, dropNum );

            }


        },
        over: function ( event, ui ) {
            $( this ).addClass( 'Active' );
        },
        out: function ( event, ui ) {
            $( this ).removeClass( 'Active' );
        },
    } );
    if ( game.turns < 6 ) {
        $( '.draggable' ).draggable( "disable" );
        return;
    }
    $( ".ripplelink" ).click( function ( e ) {


        if ( $( this ).find( ".ink" ).length === 0 ) {

            $( this ).prepend( "<span class='ink'></span>" );

        }
        var ink = $( this ).find( ".ink" );
        ink.removeClass( "animate" );

        if ( !ink.height() && !ink.width() ) {
            var d = Math.max( $( this ).outerWidth(), $( this ).outerHeight() );
            ink.css( {
                height: d,
                width: d
            } );
        }

        var x = e.pageX - $( this ).offset().left - ink.width() / 2;
        var y = e.pageY - $( this ).offset().top - ink.height() / 2;

        ink.css( {
            top: y + 'px',
            left: x + 'px'
        } ).addClass( "animate" );
    } );
}
game.init();
buildractive();
$( document ).ready( function () {

    $( '.game' ).click( function () {
        goTo( '#gameBoard', '.game' );
    } );
    $( '.settings' ).click( function () {
        goTo( '#settingsPage', '.settings' );
    } );
    $( '.rules' ).click( function () {
        goTo( '#rules', '.rules' );
    } );
    $( function () {
        FastClick.attach( document.body );
    } );
    dragAndDrop();
    if ( document.location.hash ) {
        var which = [
            [ 'g', '.game' ],
            [ 's', '.settings' ],
            [ 'r', '.rules' ]
        ];
        console.log( document.location.hash );
        for ( var i = which.length;; i-- ) {
            if ( ( document.location.hash + "" ).slice( 1, 2 ) == which[ i - 1 ][ 0 ] ) {
                goTo( document.location.hash, which[ i - 1 ][ 1 ] );
                break;
            }
        }
    }
} );
