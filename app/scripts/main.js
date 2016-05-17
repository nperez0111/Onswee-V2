var game, settings;


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
        game.set( 'selected', num );
        game.set( 'moveables', arr );

    } else if ( bool ) {
        //move to num if it is one of the move locs
        var flag = false;
        if ( game.retRes( game.allPosMoveLocs[ snum ], ( function ( cur, i ) {
                if ( game.board[ cur ] === null ) {
                    game.moveFromTo( game.board[ snum ], snum, num );
                    game.set( 'selected', -1 );
                    game.set( 'moveables', [] );
                    if ( game.board.every( function ( a ) {
                            return a == null;
                        } ) ) {
                        game.justWon = true;
                    }
                    return true;
                }
            } ) ) ) {
            return;
        }

    }
    game.updateHUD();
    game.justWon = false;

}



function buildgame() {
    game = new Game( {
        el: 'gameBoard',
        template: '#template',
        data: {}
    } );
    settings = new Ractive( {
        el: 'settingsPage',
        template: '#settings',
        oninit: function () {
            this.observe( 'player1', function ( newValue, oldValue ) {
                if ( newValue && game ) {
                    game.setName( newValue, true );
                    this.set( 'player1', newValue );
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
            if ( ( game.get( "board" )[ game.toInt( $( this ).attr( 'id' ).replace( /^\D+/g, "" ) ) ] !== null ) || !dropped ) {
                game.set( "dontSelect", game.get( "board" )[ game.toInt( $( this ).attr( 'id' ).replace( /^\D+/g, "" ) ) ] !== null );
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
                if ( game.get( 'selected' ) > -1 ) {
                    $( this ).removeClass( 'Active' );
                    game.set( 'selected', -1 );
                    game.set( 'moveables', [] );
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
            if ( ( game.get( "player" ) ) !== game.get( "board" )[ dragNum ] ) {
                game.illegal( "Sorry " + game.getName( game.get( "board" )[ dragNum ] ) + ", it's " + game.getName( !game.get( "board" )[ dragNum ] ) + "'s turn!" );
                return false;
            } else if ( dragNum == dropNum ) {
                return false;
            } else if ( game.get( "board" )[ dropNum ] !== null ) {
                //Something there
                game.illegal( 'Something already there!' );
                return false;

            } else if ( !game.canMoveFromTo( game.get( "board" )[ dragNum ], game.get( "board" ).clone(), dragNum, dropNum ) ) {

                game.illegal( "Sorry that's too far to move to!" );
                return false;

            } else {

                game.moveFromTo( game.get( "player" ), dragNum, dropNum );

            }


        },
        over: function ( event, ui ) {
            $( this ).addClass( 'Active' );
        },
        out: function ( event, ui ) {
            $( this ).removeClass( 'Active' );
        },
    } );
    if ( game.get( "turns" ) < 6 ) {
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
buildgame();
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
