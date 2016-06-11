var game, settings;


function resetMe() {
    game.illegal( '~Reset Complete!', "success" );
    game.set( "turns", 0 );
    localStorage.clear();
    game.set( "justWon", true );
    game.initer();
    game.set( "justWon", false );
    game.update();
    game.save();
    game.set( "score", [ 0, 0 ] );
    game.updateHUD();
}

function setName( player ) {
    var str = $( '#' + ( player ? 'player1' : 'player2' ) ).val();
    settings.set( player ? 'player1' : 'player2', str );
    game.setName( str, player );
}


function drop( ev ) {
    ev.preventDefault();
    game.set( "justWon", false );
    if ( ev.dataTransfer.getData( "which" ) ) {
        var drag = game.toInt( ev.dataTransfer.getData( "which" ) ),
            dropp = game.toInt( ev.target.id.replace( /^\D+/g, "" ) );
        game.moveFromTo( game.get( "board" )[ drag ], drag, dropp );
    }

}


var game, settings;



function buildgame() {
    game = new Game( {
        el: 'gameBoard',
        template: '#template',
        data: {},
        onrender: function () {

            dragAndDrop( this );
        }
    } );
    settings = new Ractive( {
        el: 'settingsPage',
        template: '#settings',
        oninit: function () {
            this.observe( 'player1', function ( newValue, oldValue ) {
                if ( newValue && game ) {
                    game.setName( newValue, true );
                    this.update();
                }
            } );
            this.observe( 'player2', function ( newValue, oldValue ) {
                if ( newValue && game ) {
                    game.setName( newValue, false );
                    this.update();
                }
            } );
            this.on( "choosePlayer", function ( event, val ) {
                this.set( "player", val );
            } );
            this.on( "setIcon", function ( event, params ) {
                params = params.split( ":" );
                this.set( game.setIcon( params[ 0 ] == "true" ? 1 : 0, game.toInt( params[ 1 ] ) ) );
            } );
            this.observe( "ai", function ( newVal, oldVal ) {
                game.set( "ai", newVal );
                if ( ( game.get( "player" ) == false ) ) {
                    //if is player2 do the ai turn instead
                    game.aiTurn();
                }
            } );
        },
        data: {
            player1: game.get( "player1Name" ),
            player2: game.get( "player2Name" ),
            icon: game.get( "icon" ),
            iconPossibles: game.get( "iconPossibles" ),
            player: false,
            ai: game.get( "ai" ),
        }
    } );

}

function dragAndDrop( obj ) {
    var hadnt = true;
    $( '.draggable' ).draggable( {
        containment: $( '#gameBoard' ),
        cursor: "pointer",
        opacity: 0.8,
        revert: function ( dropped ) {
            //if it is not the players turn then send the draggable to where it was
            if ( ( obj.get( "board" )[ obj.toInt( $( this ).attr( 'id' ).replace( /^\D+/g, "" ) ) ] !== null ) || !dropped ) {
                obj.set( "dontSelect", obj.get( "board" )[ obj.toInt( $( this ).attr( 'id' ).replace( /^\D+/g, "" ) ) ] !== null );
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
                if ( obj.get( 'selected' ) > -1 ) {
                    $( this ).removeClass( 'Active' );
                    obj.set( 'selected', -1 );
                    obj.set( 'moveables', [] );
                }
            }

        }
    } );

    $( ".drop" ).droppable( {

        accept: ".draggable",
        tolerance: "pointer",
        drop: function ( event, ui ) {
            console.log( "fired" );
            var dropNum = obj.toInt( $( this ).attr( 'id' ).replace( /^\D+/g, "" ) ),
                dragNum = obj.toInt( $( ui.draggable ).attr( 'id' ).replace( /^\D+/g, "" ) );
            $( this ).removeClass( 'Active' );
            if ( ( obj.get( "player" ) ) !== obj.get( "board" )[ dragNum ] ) {
                obj.illegal( "Sorry " + obj.getName( obj.get( "board" )[ dragNum ] ) + ", it's " + obj.getName( !obj.get( "board" )[ dragNum ] ) + "'s turn!" );
                return false;
            } else if ( dragNum == dropNum ) {
                return false;
            } else if ( obj.get( "board" )[ dropNum ] !== null ) {
                //Something there
                obj.illegal( 'Something already there!' );
                return false;
            } else if ( !obj.canMoveFromTo( obj.get( "board" )[ dragNum ], obj.get( "board" ).clone(), dragNum, dropNum ) ) {

                obj.illegal( "Sorry that's too far to move to!" );
                return false;

            } else {

                obj.moveFromTo( obj.get( "player" ), dragNum, dropNum );

            }


        },
        over: function ( event, ui ) {
            $( this ).addClass( 'Active' );
        },
        out: function ( event, ui ) {
            $( this ).removeClass( 'Active' );
        },
    } );

    if ( obj.get( "turns" ) < 6 ) {
        $( '.draggable' ).draggable( "disable" );
        return;
    } else {
        $( '.draggable' ).draggable( "enable" );
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

$( document ).ready( function () {
    buildgame();
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
    if ( document.location.hash ) {
        var which = [
            [ 'g', '.game' ],
            [ 's', '.settings' ],
            [ 'r', '.rules' ]
        ];
        //console.log( document.location.hash );
        for ( var i = which.length;; i-- ) {
            if ( ( document.location.hash + "" ).slice( 1, 2 ) == which[ i - 1 ][ 0 ] ) {
                goTo( document.location.hash, which[ i - 1 ][ 1 ] );
                break;
            }
        }
    }
} );

function goTo( which, link ) {
    var whiches = game.get( "which" );
    if ( whiches && whiches[ 0 ] == which ) {
        return;
    }

    $( whiches[ 0 ] ).slideUp( 'slow' );
    $( which ).slideDown( 'slow' );
    $( link ).addClass( 'active' );
    $( whiches[ 1 ] ).removeClass( 'active' );

    game.set( "which", [ which, link ] );

}
