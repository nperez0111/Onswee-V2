<<<<<<< HEAD
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
=======
var game, settings;

>>>>>>> master

function resetMe() {
    game.illegal( 'Reset Complete!' );
    game.turns = 0;
    localStorage.clear();
    game.justWon = true;
    game.init();
    game.justWon = false;
    game.update();
    game.save();
    game.score = [ 0, 0 ];
    game.updateHUD();
}

function setAI() {
<<<<<<< HEAD
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
=======
    game.ai = $( '#ai' ).is( ':checked' );
    if ( ( game.turns % 2 == 1 ) ) {
        //if is player2 do the ai turn instead
        game.aiTurn();
    }
    settings.set( 'ai', game.ai );
}

function setName( player ) {
    var str = $( '#' + ( player ? 'player1' : 'player2' ) ).val();
    settings.set( player ? 'player1' : 'player2', str );
    game.setName( str, player );
}

function select( num ) {
    if ( game.get( "turns" ) < 6 ) {
        return;
    }
    if ( game.get( "dontSelect" ) ) {
        game.set( "dontSelect", false );
        return;
    }
    var snum = game.toInt( game.get( 'selected' ) ),
        bool = num === game.get( 'moveables' )[ 0 ] || num === game.get( 'moveables' )[ 1 ] || num === game.get( 'moveables' )[ 2 ];
    if ( snum == num ) {
        //deselect that board position and make those positions un special and set setts.selected to -1
        game.set( 'selected', -1 );
        game.set( 'moveables', [] );
    } else if ( snum == -1 || !bool ) {
        //is not set so let's set current num to special and possible move locs to activated
        if ( game.get( "board" )[ num ] == game.get( "player" ) ) {
            game.illegal( "It's " + game.getName( game.get( "player" ) ) + "'s turn!" );
>>>>>>> master
            return;
        }

        var arr = [];
        for ( var c = 0, all = game.allPosMoveLocs[ num ], cl = all.length; c < cl; c++ ) {
<<<<<<< HEAD
            if ( game.board[ all[ c ] ] === null ) {
                if ( game.turns < 12 && game.hasIllegalLineIn( game.board[ num ], game.hypotheticalMoveInFromTo( game.board[ num ], game.board, num, all[ c ] ) ) ) {
=======
            if ( game.get( "board" )[ all[ c ] ] === null ) {
                if ( game.get( "turns" ) < 12 && game.hasIllegalLineIn( game.get( "board" )[ num ], game.hypotheticalMoveInFromTo( game.get( "board" )[ num ], game.get( "board" ), num, all[ c ] ) ) ) {
>>>>>>> master

                } else {
                    arr.push( all[ c ] );
                }
            }
        }

        if ( arr.length === 0 ) {
            game.illegal( "Can't make any straight lines in these turns" );
            return;
        }
<<<<<<< HEAD
        ractive.set( 'selected', num );
        ractive.set( 'moveables', arr );
=======
        game.set( 'selected', num );
        game.set( 'moveables', arr );
>>>>>>> master

    } else if ( bool ) {
        //move to num if it is one of the move locs
        var flag = false;
        if ( game.retRes( game.allPosMoveLocs[ snum ], ( function ( cur, i ) {
<<<<<<< HEAD
                if ( game.board[ cur ] === null ) {
                    game.moveFromTo( game.board[ snum ], snum, num );
                    ractive.set( 'selected', -1 );
                    ractive.set( 'moveables', [] );
                    if ( game.board.every( function ( a ) {
                            return a == null;
                        } ) ) {
                        game.justWon = true;
=======
                if ( game.get( "board" )[ cur ] === null ) {
                    game.moveFromTo( game.get( "board" )[ snum ], snum, num );
                    game.set( 'selected', -1 );
                    game.set( 'moveables', [] );
                    if ( game.get( "board" ).every( function ( a ) {
                            return a == null;
                        } ) ) {
                        game.set( "justWon", true );
>>>>>>> master
                    }
                    return true;
                }
            } ) ) ) {
            return;
        }

    }
    game.updateHUD();
<<<<<<< HEAD
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
=======
    game.set( "justWon", false );

}



function buildgame() {
    game = new Game( {
        el: 'gameBoard',
        template: '#template',
        data: {}
>>>>>>> master
    } );
    settings = new Ractive( {
        el: 'settingsPage',
        template: '#settings',
        oninit: function () {
            this.observe( 'player1', function ( newValue, oldValue ) {
<<<<<<< HEAD
                if ( game ) {
                    game.setName( newValue, true );
                    settings.set( 'player1', newValue );
=======
                if ( newValue && game ) {
                    game.setName( newValue, true );
                    this.set( 'player1', newValue );
>>>>>>> master
                    this.update();
                }
            } );
            this.observe( 'player2', function ( newValue, oldValue ) {
                game.setName( newValue, false );
                this.set( 'player2', newValue );
                this.update();
            } );
        },
        data: {
            player1: game.get( "player1Name" ),
            player2: game.get( "player2Name" ),
            icon: game.get( "icon" ),
            iconPossibles: game.get( "iconPossibles" ),
            player: 0,
            ai: game.get( "ai" ),
        }
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
<<<<<<< HEAD
            if ( ( game.board[ game.toInt( $( this ).attr( 'id' ).replace( /^\D+/g, "" ) ) ] !== null ) || !dropped ) {
                game.dontSelect = ( game.board[ game.toInt( $( this ).attr( 'id' ).replace( /^\D+/g, "" ) ) ] !== null );
=======
            if ( ( game.get( "board" )[ game.toInt( $( this ).attr( 'id' ).replace( /^\D+/g, "" ) ) ] !== null ) || !dropped ) {
                game.set( "dontSelect", game.get( "board" )[ game.toInt( $( this ).attr( 'id' ).replace( /^\D+/g, "" ) ) ] !== null );
>>>>>>> master
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
<<<<<<< HEAD
                if ( ractive.get( 'selected' ) > -1 ) {
                    $( this ).removeClass( 'Active' );
                    ractive.set( 'selected', -1 );
                    ractive.set( 'moveables', [] );
=======
                if ( game.get( 'selected' ) > -1 ) {
                    $( this ).removeClass( 'Active' );
                    game.set( 'selected', -1 );
                    game.set( 'moveables', [] );
>>>>>>> master
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
<<<<<<< HEAD
            if ( ( game.turns % 2 === 0 ) !== game.board[ dragNum ] ) {
                game.illegal( "Sorry " + game.getName( game.board[ dragNum ] ) + ", it's " + game.getName( !game.board[ dragNum ] ) + "'s turn!" );
                return false;
            } else if ( dragNum == dropNum ) {
                return false;
            } else if ( game.board[ dropNum ] !== null ) {
=======
            if ( ( game.get( "player" ) ) !== game.get( "board" )[ dragNum ] ) {
                game.illegal( "Sorry " + game.getName( game.get( "board" )[ dragNum ] ) + ", it's " + game.getName( !game.get( "board" )[ dragNum ] ) + "'s turn!" );
                return false;
            } else if ( dragNum == dropNum ) {
                return false;
            } else if ( game.get( "board" )[ dropNum ] !== null ) {
>>>>>>> master
                //Something there
                game.illegal( 'Something already there!' );
                return false;

<<<<<<< HEAD
            } else if ( !game.canMoveFromTo( game.board[ dragNum ], game.board.clone(), dragNum, dropNum ) ) {
=======
            } else if ( !game.canMoveFromTo( game.get( "board" )[ dragNum ], game.get( "board" ).clone(), dragNum, dropNum ) ) {
>>>>>>> master

                game.illegal( "Sorry that's too far to move to!" );
                return false;

            } else {

<<<<<<< HEAD
                game.moveFromTo( game.turns % 2 === 0, dragNum, dropNum );
=======
                game.moveFromTo( game.get( "player" ), dragNum, dropNum );
>>>>>>> master

            }


        },
        over: function ( event, ui ) {
            $( this ).addClass( 'Active' );
        },
        out: function ( event, ui ) {
            $( this ).removeClass( 'Active' );
        },
    } );
<<<<<<< HEAD
    if ( game.turns < 6 ) {
=======
    if ( game.get( "turns" ) < 6 ) {
>>>>>>> master
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
<<<<<<< HEAD
game.init();
buildractive();
=======
buildgame();
>>>>>>> master
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
