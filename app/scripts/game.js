var Game = Ractive.extend( {

    initer: function () {
        this.set( "board", [ null, null, null, null, null, null, null, null, null ] );
        this.set( "turns", 0 );
        this.set( "moves", [] );
        if ( !this.get( "justWon" ) && this.load() ) {
            //any post load
        } else {
            if ( !supportsLocalStorage() ) {
                return;
            }
            //any first time code here

        }

    },
    oninit: function () {
        this.on( "placePiece", function ( event, args ) {
            args = args.split( ":" );
            if ( this.placePiece( args[ 0 ] == "true", parseInt( args[ 1 ] ) ) && this.get( "ai" ) ) {
                this.aiTurn();
            }
        } );
        this.on( "select", function ( event, num ) {

            if ( this.get( "turns" ) < 6 ) {
                return;
            }
            if ( this.get( "dontSelect" ) ) {
                this.set( "dontSelect", false );
                return;
            }
            var snum = this.toInt( this.get( 'selected' ) ),
                bool = num === this.get( 'moveables' )[ 0 ] || num === this.get( 'moveables' )[ 1 ] || num === this.get( 'moveables' )[ 2 ];
            //console.log( num, snum, bool );
            if ( snum == num ) {
                //deselect that board position and make those positions un special and set setts.selected to -1
                this.set( 'selected', -1 );
                this.set( 'moveables', [] );
            } else if ( snum == -1 || !bool ) {
                //is not set so let's set current num to special and possible move locs to activated
                if ( this.get( "board" )[ num ] == !this.get( "player" ) ) {
                    this.illegal( "~It's " + this.getName( this.get( "player" ) ) + "'s turn!" );
                    return;
                }

                var arr = [];
                for ( var c = 0, all = this.allPosMoveLocs[ num ], cl = all.length; c < cl; c++ ) {
                    if ( this.get( "board" )[ all[ c ] ] === null ) {
                        if ( this.get( "turns" ) < 12 && this.hasIllegalLineIn( this.get( "board" )[ num ], this.hypotheticalMoveInFromTo( this.get( "board" )[ num ], this.get( "board" ), num, all[ c ] ) ) ) {

                        } else {
                            arr.push( all[ c ] );
                        }
                    }
                }

                if ( arr.length === 0 ) {
                    this.illegal( "Sorry, " + this.getName( this.get( 'player' ) ) + " but you can't make straight lines the first six turns.~Can't make any straight lines in these turns" );
                    return;
                }
                this.set( 'selected', num );
                this.set( 'moveables', arr );

            } else if ( bool ) {
                //move to num if it is one of the move locs
                var flag = false,
                    thi = this;
                if ( this.retRes( thi.allPosMoveLocs[ snum ], ( function ( cur, i ) {
                        if ( thi.get( "board" )[ cur ] === null ) {
                            thi.moveFromTo( thi.get( "board" )[ snum ], snum, num );
                            thi.set( 'selected', -1 );
                            thi.set( 'moveables', [] );
                            if ( thi.get( "board" ).every( function ( a ) {
                                    return a == null;
                                } ) ) {
                                thi.set( "justWon", true );
                            }
                            return true;
                        }
                    } ), true ) ) {
                    return;
                }

            }
            //this.updateHUD();
            this.set( "justWon", false );
            /*if ( this.get( "ai" ) ) {
                this.aiTurn()
            }*/


        } );
    },
    data: function () {
        //9 possible positions Null==Empty, True==Player1, False==Player2
        return {
            board: [ null, null, null, null, null, null, null, null, null ],
            moveables: [],
            selected: -1,
            player1Name: "Player 1",
            player2Name: "Player 2",
            dontSelect: false,
            turns: 0,
            which: [ '#gameBoard', '.game' ],
            justWon: false,
            // to fix browser eager click post win 
            icon: [ 'images/x.png', 'images/o.png' ],
            //default icons and who it is set to
            iconPossibles: [ 'images/default3.png', 'images/default4.png', 'images/default5.png', 'images/default6.png', 'images/default7.png', 'images/default8.png' ],
            //these are all of the possible icons to choose from
            score: [ 0, 0 ],
            //scores of the two players
            //Saves current state of the game each change that has been made to continue game later
            moves: [],
            ai: false,
            isActive: function ( num ) {
                return this.get( 'moveables' ).filter( function ( cur ) {
                    return cur == num;
                } ).length > 0;

            }
        }
        //Saves current turn, (turn%2==0) gives current players turn
    },
    computed: {
        turn: {
            get: function () {
                return this.get( "board" ) > 5;
            }
        },
        getIcon: {
            get: function ( player ) {
                return this.icon[ player ? 0 : 1 ];
            }
        },
        player: {
            get: function () {
                return this.get( "turns" ) % 2 == 0;
            }
        }
    },
    getName: function ( player ) {
        if ( player === 0 || player === 1 ) {
            player = player === 0;
        }
        return player ? this.get( "player1Name" ) : this.get( "player2Name" );

    },
    setName: function ( str, player ) {
        if ( player ) {
            this.set( "player1Name", str );
        } else {
            this.set( "player2Name", str );
        }
        this.updateHUD();
        this.saveScore( null );
        //reflect Name change to HUD

    },
    setIcon: function ( player, icon ) {
        if ( ( this.get( "icon." + player ) == this.get( "iconPossibles." + icon ) ) || ( this.get( "icon." + this.get( "player" ) ) == this.get( "iconPossibles." + icon ) ) ) {
            //if the one we are setting it to is the one set or if the one we are setting it to is the other players then just dont set it
            return;
        }
        var tmp = this.get( "icon." + player ); //stores curicon
        this.set( "icon." + player, this.get( "iconPossibles." + icon ) ); //sets curicon to newicon

        this.set( "iconPossibles." + icon, tmp ); //sets new icon to old icon

        this.updateHUD();
        return {
            player1: this.get( "player1Name" ),
            player2: this.get( "player2Name" ),
            iconPossibles: this.get( "iconPossibles" ),
            player: this.get( "player" ),
            icon: this.get( "icon" )

        };
    },
    getEmpties: function () {
        return this.get( "board" ).map( ( cur ) => {
            return cur !== null;
        } );
    },
    placePiece: function ( player, num ) {

        if ( this.get( "turns" ) > 5 ) {
            return;
        } else if ( this.get( "board." + num ) !== null ) {
            this.illegal( 'Sorry ' + this.getName( this.get( "player" ) ) + ', that position is taken~Position taken' );
            return;
        }
        if ( this.get( "justWon" ) ) {
            this.set( "justWon", false )
            return;
        }
        var board = this.get( "board" ).clone();
        board[ num ] = player;
        if ( this.hasIllegalLineIn( player, board ) ) {
            this.illegal( "Sorry " + this.getName( this.get( "player" ) ) + ", you can't make a line when placing~Illegal Movement" );
            return;
        }

        this.set( "board", board );
        this.set( "turns", this.get( "turns" ) + 1 );
        this.set( "player" )

        if ( this.get( "ai" ) ) {
            this.aiTurn();
        }
    },
    moveFromTo: function ( player, from, to ) {
        if ( this.get( "turns" ) < 12 && this.moveFromToWithRules( player, from, to ) === false ) {
            return false;
        }
        var board = this.get( "board" );
        if ( board[ from ] == player && board[ to ] === null ) {
            if ( from !== this.center ) {
                if ( this.retRes( this.illegalMovements[ from ], ( ( cur ) => {
                        if ( cur == to ) {
                            this.illegal( "Sorry, you can't move there!" );
                            console.log( "Attempted to move from %s to %s with player %s", from, to, player ? 'X' : 'O' );
                            return true;
                        }
                    } ), true ) ) {
                    return;
                }
            }



            this.animateTo( from, to, ( thi, from, to ) => {

                this.set( "board." + to, this.get( "board" )[ from ] );
                this.set( "board." + from, null );
                this.set( "turns", this.get( "turns" ) + 1 );
                this.storeMoves( from, to );
                console.trace( "Successful Movement, From: %s To: %s For %s", from, to, this.get( "board." + to ) ? 'X' : 'O' );
                this.trackcurrent( this.get( "board" ) );
                this.updateHUD();

                if ( this.isWinIn( this.get( "board" )[ to ], this.get( "board" ) ) ) {
                    console.log( "%c%s Won!", "color:red;font-size:20px;", this.getName( !this.get( "board." + to ) ) );
                    this.illegal( ( '~' + this.getName( player ) + ' won!~' + this.get( "icon" )[ player ? 0 : 1 ] + "~src~2500" ), "success" );
                    this.newGame( this.get( "board" )[ to ] );
                } else if ( this.get( "ai" ) ) {
                    setTimeout( () => {
                        this.aiTurn();
                    }, 2000 );
                }
                this.save();
            } );

            return;
        } else {
            //Figure out what to do if its an invalid position
            console.log( "Attempted to move from %s to %s with player %s", from, to, player ? 'X' : 'O' );
            this.illegal( "Sorry " + this.getName( this.get( "player" ) ) + ", you can't move there!" );
        }
    },
    // accepts player interger position from and to on the board and moves if no errors occur

    moveFromToWithRules: function ( player, from, to ) {
        if ( this.hasIllegalLineIn( player, this.hypotheticalMoveInFromTo( player, this.get( "board" ), from, to ) ) ) {
            this.illegal( "During these turns you can't make a line of any kind~Remember" );

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
    save: function () {
        //save turn, save current moves, add last board state to moves, save names, save icons, save scores
        if ( !supportsLocalStorage() ) {
            return false;
        }

        localStorage.isPlaying = this.get( "turns" ) > 0 ? true : false;
        //store things if game is in progress
        localStorage.setObj( 'board', this.get( "board" ) );
        localStorage.turn = this.get( "turns" );
        localStorage.setObj( 'moves', this.get( "moves" ) );
        localStorage.setObj( 'icons', [ this.get( "icon" ), this.get( "iconPossibles" ) ] );
        localStorage.ai = this.get( "ai" );



    },
    storeMoves: function ( from, to ) {

        this.get( "moves" ).push( [ from, to ] );

    },
    undo: function () {

        if ( this.get( "moves" ).length < 2 ) {
            return false;
        }

        var last = this.get( "moves" ).pop();
        this.set( "turns", this.get( "turns" ) - 1 );
        this.moveFromTo( this.get( "player" ), last[ 1 ], last[ 0 ] );
        this.save();
        this.updateHUD();

    },
    load: function () {
        if ( !supportsLocalStorage() || !( localStorage.isPlaying ) || ( localStorage.isPlaying == 'false' ) ) {
            return false;
        }
        this.set( "ai", ( localStorage.ai == 'true' ) );
        this.set( "board", localStorage.getObj( 'board' ) );
        this.set( "turns", this.toInt( localStorage.turn ) );
        this.set( "moves", localStorage.getObj( 'moves' ) );
        this.set( "icon", localStorage.getObj( 'icons' )[ 0 ] || this.get( "icon" ) );
        this.set( "iconPossibles", localStorage.getObj( 'icons' )[ 1 ] || this.get( "iconPossibles" ) );
        this.set( "score", localStorage.getObj( 'score' ) || [ 0, 0 ] );
        var players = localStorage.getObj( 'players' );
        if ( players !== null ) {
            this.set( "player1Name", players[ 0 ] );
            this.set( "player2Name", players[ 1 ] );
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

        var that = this;
        $( el ).animate( {
            left: ( distanceX * $( '.boardPlaceHolder' ).outerWidth() + 'px' ),
            top: ( distanceY * $( '.boardPlaceHolder' ).outerHeight() + 'px' )
        }, {
            duration: 1000,
            complete: function () {
                callback( that, from, to );
            }
        } );

    },
    updateHUD: function () {

        if ( this.get( "turns" ) == 4 && this.score == [ 0, 0 ] ) {
            this.illegal( "Sorry " + this.getName( this.get( "player" ) ) + ", You can't place in a line yet!~Remember" );
        } else if ( this.get( "turns" ) == 6 && this.score == [ 0, 0 ] ) {
            this.illegal( "Sorry " + this.getName( this.get( "player" ) ) + ", You can't make any straight lines yet!~Remember" );
        } else if ( this.get( "turns" ) == 12 ) {
            this.illegal( "~You can make lines!", "success" );
        }


        dragAndDrop( this );

    },
    //updates HUD to current values



    saveScore: function ( player ) {
        if ( player !== null ) {
            var t = player ? 0 : 1;
            this.set( "score." + t, this.get( "score." + t ) + 1 );
            localStorage.setObj( 'score', this.get( "score" ) );
        }
        //console.log( 'called save score' );
        //saves scores into score array
        if ( !supportsLocalStorage() ) {
            return;
        }
        var arr = [ this.get( "player1Name" ), this.get( "player2Name" ), this.get( "score" ) ];
        if ( localStorage.getObj( 'players' ) === null ) {
            localStorage.setObj( 'players', arr );
        } else {
            var players = localStorage.getObj( 'players' );
            var p1 = arr[ 0 ],
                p2 = arr[ 1 ];
            for ( var i = 0, l = players.length, fl = p1.length, sl = p2.length; i < l; i += 3 ) {
                if ( players[ i ] == p1 && players[ i + 1 ] == p2 ) {
                    players[ i + 2 ][ player ? 0 : 1 ] += player === null ? 0 : 1;
                    localStorage.setObj( 'players', players );
                    return;
                } else if ( Math.abs( players[ i ].length - fl ) == 1 ) {
                    if ( players[ i ] == p1.slice( 0, players[ i ].length ) || players[ i ].slice( 0, fl ) == p1 ) {
                        players[ i ] = p1;
                        localStorage.setObj( 'players', players );
                        return;

                    }
                } else if ( Math.abs( players[ i + 1 ].length - sl ) == 1 ) {
                    if ( players[ i + 1 ] == p2.slice( 0, players[ i + 1 ].length ) || players[ i + 1 ].slice( 0, sl ) == p2 ) {
                        players[ i + 1 ] = p2;
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
        this.set( "justWon", true );
        this.initer();
        this.set( "justWon", false );
        this.updateHUD();
    },
    //Resets all settings to default and updates HUd to reflect a wiped game

    animationIsGoing: false,
    //to prevent browser eagerclick

    illegal: function ( errorMsg, actualErrorOveride ) {
        var d = errorMsg.split( "~" );
        //d in the format [Message,Title,icon,icoType,time]
        this.notify( d[ 1 ] || "Message:", d[ 0 ], this.toInt( d[ 4 ] || 1900 ), actualErrorOveride || "error", d[ 2 ], d[ 3 ] );
    },
    //something illegal happened
    notify: function ( title, message, time, typely, icon, icotype ) {
        var that = this,
            not = $.notify( {
                title: ( typely && typely === "error" ? '<span class="glyphicon glyphicon-warning-sign"></span> ' + title : title ),
                message: message,
                icon: icon || null
            }, {
                type: typely || '',
                delay: ( time || 0 ) + 3000,
                icon_type: icotype || "src",
                placement: {
                    from: "top",
                    align: "right"
                },
                template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-minimalist alert-minimalist-{0}" role="alert">' +
                    '<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button><img data-notify="icon" class="img-circle pull-left">' +
                    '<span data-notify="title">{1}</span>' +
                    '<span data-notify="message">{2}</span>' +
                    '</div>'
            } );
        return not;
    },
    retRes: function ( arr, func, brek = false ) {
        var ret = false;
        arr.forEach( ( cur, i, arr ) => {
            if ( brek && ret !== false ) {
                return;
            }
            var temp = func( cur, i, arr );
            if ( temp ) {
                ret = temp;
            }
        } );
        return ret;
    },
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
        return arr1.every( function ( x, i ) {
            return x == arr2[ i ];
        } );
    },
    //if two arrays are equal returns true
    twoOutOfThree: function ( arr1, arr2 ) {
        var count = 0,
            c = 0;
        arr1.clone().reverse().forEach( function ( cur, i ) {
            if ( cur !== arr2[ i ] ) {
                count++;
                c = cur;
            }
        } )

        return count == 1 ? c : -1;
    },
    //if two arrays are equal returns true
    choosePreffered: function ( player, board ) {
        if ( board[ this.center ] === null ) {
            return this.center;
        }
        var arr = board.map( ( c, i ) => {
            return i;
        } ).filter( ( cur, i ) => {
            var b = board.clone();
            b[ cur ] = player;
            return ( board[ cur ] === null && ( !this.hasIllegalLineIn( player, b ) ) );
        } );

        return arr[ this.toInt( Math.random() * arr.length ) ];
    },
    //chooses preffered location randomly returns integer position of empty space to put into
    toInt: function ( inter ) {
        return parseInt( inter, 10 );
    },
    //converts to int

    hasPossibleLineIn: function ( player, board ) {
        var c = false;
        if ( this.hasCenterIn( player, board ) ) {
            c = this.retRes( this.pairArrangements.filter( ( c, i ) => {
                return i > 3;
            } ), ( cur, i ) => {
                var val = 4 + i;
                if ( board[ cur[ 0 ] ] == player && board[ cur[ 1 ] ] == player ) {

                    if ( board[ this.pairArrangements[ -2 * ( val % 2 ) + val + 1 ][ -2 * ( val % 2 ) + 1 ] ] === null ) {
                        return val;
                    }
                }
            } );


        }
        return c != false ? c : false || this.retRes( this.pairArrangements, ( cur, i ) => {
            if ( board[ cur[ 0 ] ] == player && board[ cur[ 1 ] ] == player ) {
                return i;
            }
        } ) || 12;

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

        return ( cur[ 1 ] == pos[ 1 ] && cur[ 2 ] == pos[ 2 ] );

    },
    //returns true if specified player has a line through the center in the specified board

    hasIllegalLineIn: function ( player, board ) {
        if ( this.get( "turns" ) > 12 ) {
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
                    this.set( "turns", 0 );
                    return;
                }

                this.moveFromTo( player, possibles[ i ], this.pairArrangements[ ( pairArrOutPut % 2 ) === 0 ? pairArrOutPut + 1 : pairArrOutPut - 1 ][ ( pairArrOutPut % 2 ) === 0 ? 1 : 0 ] );
                this.set( "turns", 0 );
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

        prev.forEach( function ( cur, i ) {
            if ( cur !== newy[ i ] ) {
                if ( cur === null ) {
                    re[ 1 ] = i;
                }
                if ( cur !== null ) {
                    re[ 0 ] = i;
                }
            }
        } );
        return re;
    },
    //returns the changebetween two boards returned in format [from,to]

    getPossibleBoardArrangementsFrom: function ( player, board ) {
        return this.findPlayersPosIn( player, board ).map( ( from ) => {
            return this.allPosMoveLocs[ from ].filter( to => {
                return this.canMoveFromTo( player, board, from, to );
            } ).map( to => {
                return this.hypotheticalMoveInFromTo( player, board, from, to );
            } )
        } ).reduce( ( prev, newy ) => {
            return prev.concat( newy );
        }, [] );

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

    placePiece: function ( player, pos ) {
        if ( this.get( "turns" ) > 5 ) {
            return false;
        }
        if ( this.get( "board" )[ pos ] === null && ( this.hasIllegalLineIn( player, this.hypotheticalMoveInFromTo( player, this.get( "board" ).clone(), pos, pos ) ) === false ) ) {
            this.set( "board." + [ pos ], player );
            this.set( "turns", this.get( "turns" ) + 1 );
            this.updateHUD();
            if ( this.get( "turns" ) == 5 ) {
                this.set( "moves.0", this.get( "board" ) );
            }
            this.save();
            this.trackcurrent( this.get( "board" ) );
            return true;
        }
        this.illegal( this.get( "board" )[ pos ] === null ? "Sorry, " + this.getName( this.get( 'player' ) ) + " but you can't make straight lines the first six turns.~Can't make any straight lines in these turns" : "Sorry " + this.getName( this.get( "player" ) ) + ", that space is filled!~Space already has piece.", "warning" );
        return false;
    },
    //places Piece in Board if possible
    aiTurn: function () {
        console.trace( "aiturn" )
        console.log( '__________________AI Turn' );
        if ( this.get( "turns" ) > 5 ) {

            this.chooseBestMove( false, this.get( "board" ) );

        } else {
            this.placePiece( false, this.choosePreffered( false, this.get( "board" ) ) );
        }
        this.trackcurrent( this.get( "board" ) );
        console.log( '__________________End AI turn' );

        this.updateHUD();
    },
    //AI's turn invoked after the user does their turn
    chooseBestMove: function ( player, board ) {
        var bool = this.get( "turns" ) > 11,
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

        var initialMovesPos = this.trimArrangements( player, this.getPossibleBoardArrangementsFrom( player, this.get( "board" ) ) ),
            OpponentsPossibleMoves = [],
            playersFutureMoves = [],
            initialMoveRankings = [],
            opponentMoveRankings = [],
            futureMoveRankings = [];

        if ( initialMovesPos.length === 0 ) {
            this.moveIntoAnyOpenPos( player );
            console.log( "Welp We Lost :(" );
            return;

        } else if ( initialMovesPos.length == 1 ) {

            //just skip we will move into that position that is possible now
            console.log( "Only one position to move to really :/" );

        } else {

            initialMovesPos.forEach( ( initial, fi ) => {
                //console.log("Working the first round for the %s time",first+1);
                //goes through first set

                var oppOptions = this.getPossibleBoardArrangementsFrom( !player, initial );
                OpponentsPossibleMoves.push( oppOptions );

                //console.log("Calculated and stored OpponentsPossibleMoves");

                initialMoveRankings.push( [ this.rankBoard( player, initial ), fi ] );

                //console.log("Storing first rank for the %s time!",first);


                oppOptions.forEach( ( oppOption, second ) => {

                    var playerSecond = this.trimArrangements( player, this.getPossibleBoardArrangementsFrom( player, oppOption ) );
                    //console.log("Looking through second possiblities for the %s time the length is %s",second, secondLength);
                    playersFutureMoves.push( playerSecond );

                    //console.log("Calculated and stored possibilities of Player for the %s time!",second);

                    opponentMoveRankings.push( [ this.rankBoard( !player, oppOption ), fi ] );

                    //console.log("Stored second rank at %s and %s",first,second);

                    playerSecond.forEach( ( nextMove, third ) => {
                        futureMoveRankings.push( [ this.rankBoard( player, playersFutureMoves[ second ][ third ] ), fi ] );
                        //console.log("Stored third rank at %s and %s and %s, with %s to go",first,second,third,thirdLength-third-1);


                    } )


                } );


            } );
            //console.log("We made it through that madness!!");
        }

        var
        /*AverageOfInitialMoves = this.averageArr(initialMoveRankings),
                    save = this.averageArr(opponentMoveRankings),*/
            sortedRanks = initialMoveRankings.clone().sort( compareNumbers ),
            sec = opponentMoveRankings.clone().sort( compareNumbers ),
            change = [];



        if ( initialMovesPos.length > 1 && ( sortedRanks[ sortedRanks.length - 1 ][ 0 ] ) > 0 ) {

            //benefits the AI to Play for itself
            var firstBestMove = sortedRanks[ sortedRanks.length - 1 ][ 1 ];
            var secondBestMove = sortedRanks[ sortedRanks.length - 2 ][ 1 ];


            if ( this.findBestAverage( firstBestMove, futureMoveRankings ) > this.findBestAverage( secondBestMove, futureMoveRankings ) ) {
                change = this.changeBetween( this.get( "board" ), initialMovesPos[ firstBestMove ] );

            } else {
                change = this.changeBetween( this.get( "board" ), initialMovesPos[ secondBestMove ] );
            }


        } else if ( initialMovesPos.length == 1 ) {
            change = this.changeBetween( this.get( "board" ), initialMovesPos[ 0 ] );
        } else {
            //screw the player
            console.log( "Let's screw e'm up!" );
            //console.log(opponentMoveRankings);
            //console.log(sec);

            var worstPlayForOpponent = this.findInArrOfArrs( sec[ 0 ][ 0 ], opponentMoveRankings );
            var secondWorstPlayForOp = this.findInArrOfArrs( sec[ 1 ][ 0 ], opponentMoveRankings );


            //console.log("Worst Play is at %s with a ranking of %s and board config ",worstPlayForOpponent,initialMoveRankings[worstPlayForOpponent][0]);
            //this.trackcurrent(initialMovesPos[worstPlayForOpponent]);

            //console.log("Compared To:");

            //console.log("Second Worst Play is at %s with a ranking of %s and board config ",secondWorstPlayForOp,initialMoveRankings[secondWorstPlayForOp][0]);
            //this.trackcurrent(initialMovesPos[secondWorstPlayForOp]);

            change = initialMoveRankings[ worstPlayForOpponent ][ 0 ] > initialMoveRankings[ secondWorstPlayForOp ][ 0 ] ? this.changeBetween( this.get( "board" ), initialMovesPos[ worstPlayForOpponent ] ) : this.changeBetween( this.get( "board" ), initialMovesPos[ secondWorstPlayForOp ] );
            //console.log(change);
            //console.log("Lets do that move!");


        }
        this.moveFromTo( player, change[ 0 ], change[ 1 ] );

    },
    //chooses Best Location to move to for a player
    trimArrangements: function ( player, board ) {
        var bool = this.get( "turns" ) < 12;
        return board.filter( ( cur ) => {
            if ( this.canCompleteALineIn( !player, cur ) || ( bool && this.hasIllegalLineIn( player, cur ) ) || this.isSameMoveAsLastTime( player, cur ) ) {
                return false;
            }
            return true;
        } );
    },
    //trims down unneccesary arrangements
    isSameMoveAsLastTime: function ( player, board ) {
        var moves = this.get( "moves" ),
            l = moves.length - 2,
            change = this.changeBetween( this.get( "board" ), board );
        if ( l < 7 ) {
            return false;
        }
        return ( moves[ l ][ 0 ] == change[ 1 ] && moves[ l ][ 1 ] == change[ 0 ] );
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
        console.log( 'Move into any Open Position Called.' );

        if ( this.retRes( this.findPlayersPosIn( player, this.get( "board" ) ), ( ( cur, i ) => {
                if ( this.retRes( [ 0, 1, 2 ], num => {
                        if ( this.get( "board" )[ this.allPosMoveLocs[ cur ][ num ] ] === null && !this.hasIllegalLineIn( player, this.hypotheticalMoveInFromTo( player, this.get( "board" ), cur, this.allPosMoveLocs[ cur ][ num ] ) ) ) {
                            this.moveFromTo( player, cur, this.allPosMoveLocs[ cur ][ num ] );
                            return true;
                        }
                    }, true ) ) {
                    return true;
                }
            } ), true ) ) {
            return true;
        }
        var f = [ 3, 4, 5, 6, 7, 8 ].filter( cur => {
            return this.get( "board" )[ this.allPosMoveLocs[ 4 ][ cur ] ] === null && !this.hasIllegalLineIn( player, this.hypotheticalMoveInFromTo( player, this.get( "board" ), 4, cur ) )
        } )[ 0 ];
        if ( f ) {
            this.moveFromTo( player, 4, this.allPosMoveLocs[ 4 ][ f ] );
            return true;
        } else {
            console.warn( 'Error: No open position found or something is really messed up!' );
            return false;
        }

    },
    findInArrOfArrs: function ( num, arr ) {
        var ret = arr.filter( function ( cur, i ) {
            return cur[ 0 ] == num;
        } )[ 0 ];
        return ret ? ret[ 1 ] : ret;
    },
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
    trackcurrent: function ( board ) {
        var bro = "|",
            brt = "|",
            br = "|";
        for ( var i = 0, l = board.length; i < l; i++ ) {
            if ( i / 3 < 1 ) {
                bro += board[ i ] ? ' X ' : board[ i ] === null ? ' ' + i + ' ' : ' O ';
            } else if ( i / 3 < 2 ) {
                brt += board[ i ] ? ' X ' : board[ i ] === null ? ' ' + i + ' ' : ' O ';
            } else {
                br += board[ i ] ? ' X ' : board[ i ] === null ? ' ' + i + ' ' : ' O ';
            }
        }
        bro += "|";
        brt += "|";
        br += "|";
        var whosturn = "Now it's " + this.getName( this.get( "player" ) ) + "'s turn";
        console.log( whosturn.split( "" ).fill( '_' ).join( "" ) );
        console.log( "Turn Number:" + this.get( "turns" ) );
        console.log( bro );
        console.log( brt );
        console.log( br );
        console.log( whosturn );
        console.log( whosturn.split( "" ).fill( '‾' ).join( "" ) );
    },
    //logs current board to console
} );
