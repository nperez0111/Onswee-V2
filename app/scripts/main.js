function supportsLocalStorage() {
    try {
        return 'localStorage' in window && window.localStorage !== null;
    } catch (e) {
        return false;
    }
}

Storage.prototype.setObj = function(key, value) {
    this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObj = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
};

function compareNumbers(a, b) {
        return a[0] - b[0];
    }
    //sorting of numbers in array

function compareNumber(a, b) {
        return a - b;
    }
    //sorting of numbers

Array.prototype.clone = function() {
    return this.slice(0);
};
//provides a clone method for arrays
function select(num) {
    var snum = ractive.get('selected');
    if (snum == -1) {
        //is not set so let's set current num to special and possible move locs to activated
        if (game.board[num] == (game.turns % 2 == 1)) {
            game.illegal("It's " + game.getName(game.turns % 2 === 0) + "'s turn!");
            return;
        }

        var arr = [];
        for (var c = 0, all = game.allPosMoveLocs[num], cl = all.length; c < cl; c++) {
            if (game.board[all[c]] === null) {
                if (game.turns < 12 && game.hasIllegalLineIn(game.board[num], game.hypotheticalMoveInFromTo(game.board[num], game.board, num, all[c]))) {

                } else {
                    arr.push(all[c]);
                }
            }
        }

        if (arr.length === 0) {
            game.illegal("Can't move that piece anywhere!");
            return;
        }
        ractive.set('selected', num);
        ractive.set('moveables', arr);

    } else if (snum == num) {
        //deselect that board position and make those positions un special and set setts.selected to -1
        ractive.set('selected', -1);
        ractive.set('moveables', []);
    } else if (num === ractive.get('moveables')[0] || num === ractive.get('moveables')[1] || num === ractive.get('moveables')[2]) {
        //move to num if it is one of the move locs
        for (var co = 0, allo = game.allPosMoveLocs[snum], clo = allo.length; co < clo; co++) {
            if (game.board[allo[co]] === null) {
                game.moveFromTo(game.board[snum], snum, num);
                ractive.set('selected', -1);
                ractive.set('moveables', []);
                return;
            }
        }

    }
    game.updateHUD();
    game.justWon = false;

}

function goTo(which, link) {

    if (game.which[0] == which) {
        return;
    }

    $(game.which[0]).slideUp('slow');
    $(which).slideDown('slow');
    $(link).addClass('active');
    $(game.which[1]).removeClass('active');

    game.which = [which, link];

}

function allowDrop(ev) {
    ev.preventDefault();
}

function whichAmI(ev) {
    if ((game.turns % 2 === 0) == game.board[game.toInt(ev.target.id.replace(/^\D+/g, ""))]) {
        ev.dataTransfer.setData("which", ev.target.id.replace(/^\D+/g, ""));
    } else {
        game.illegal("It's " + game.getName(game.turns % 2 === 0) + "'s turn!");
    }
}

function drop(ev) {
    ev.preventDefault();
    game.justWon = false;
    if (ev.dataTransfer.getData("which")) {
        var drag = game.toInt(ev.dataTransfer.getData("which")),
            dropp = game.toInt(ev.target.id.replace(/^\D+/g, ""));
        game.moveFromTo(game.board[drag], drag, dropp);
    }
}

var game = {

    init: function() {
        var daboard = this.board;
        for (var i = 0; i < 9; i++) {
            daboard[i] = null;
        }
        this.board = daboard;
        this.turns = 0;
        this.moves = [];
        if (this.load()) {
            //any post load
        } else {
            if (!supportsLocalStorage()) {
                return;
            }
            //any first time code here
        }

    },

    board: [null, null, null, null, null, null, null, null, null],
    //9 possible positions Null==Empty, True==Player1, False==Player2
    getEmpties: function() {
        var b = this.board;
        return [b[0] !== null, b[1] !== null, b[2] !== null, b[3] !== null, b[4] !== null, b[5] !== null, b[6] !== null, b[7] !== null, b[8] !== null];
    },
    moveFromTo: function(player, from, to) {
        if (this.turns < 12 && this.moveFromToWithRules(player, from, to) === false) {
            return false;
        }
        var board = this.board;
        if (board[from] == player && board[to] === null) {
            if (from == this.center) {

            } else {
                for (var i = 0, testMoves = this.illegalMovements[from], l = testMoves.length; i < l; i++) {
                    if (testMoves[i] == to) {
                        this.illegal("Sorry, you can't move there!");
                        console.log("Attempted to move from %s to %s with player %s", from, to, player ? 'X' : 'O');
                        return;
                    }
                }
            }
            this.board[from] = null;
            this.board[to] = player;
            this.turns++;
            this.storeMoves(from, to);
            console.log("Successful Movement, From: %s To: %s For %s", from, to, player ? 'X' : 'O');
            this.trackcurrent(this.board);
            this.updateHUD();
            if (this.isWinIn(player, board)) {
                console.log("%c%s Won!", "color:red;font-size:20px;", this.getName(player));
                this.illegal(this.getName(player) + ' won!');
                this.newGame(player);
                if (this.justWon === false) {
                    this.justWon = true;
                }
            }
            return;
        } else {
            //Figure out what to do if its an invalid position
            console.log("Attempted to move from %s to %s with player %s", from, to, player ? 'X' : 'O');
            this.illegal("Sorry, you can't move there!");
        }
    },
    // accepts player interger position from and to on the board and moves if no errors occur
    which: ['#gameBoard', '.game'],

    justWon: null,
    // to fix browser eager click post win 

    moveFromToWithRules: function(player, from, to) {
        if (this.hasIllegalLineIn(player, this.hypotheticalMoveInFromTo(player, this.board, from, to))) {
            this.illegal("Sorry, during these turns you can't make a line of any kind");

            return false;
        }
        return true;
    },

    hypotheticalMoveInFromTo: function(player, board, from, to) {

        var boardy = board.clone();
        boardy[from] = null;
        boardy[to] = player;
        return boardy;

    },
    //for the AI when it is in place

    player1Name: "Player 1",
    player2Name: "Player 2",

    turns: 0,
    //Saves current turn, (turn%2==0) gives current players turn

    getName: function(player) {

        return player ? this.player1Name : this.player2Name;

    },
    //returns String, true for P1, False for P2
    choosePlayer: function(player) {
        settings.set('player', player ? 0 : 1);
        settings.update();
    },
    setName: function(str, player) {
        if (player) {
            this.player1Name = str;
        } else {
            this.player2Name = str;
        }
        this.updateHUD();
        this.save();
        //reflect Name change to HUD
    },
    icon: ['images/x.png', 'images/o.png'],
    //default icons and who it is set to
    iconPossibles: ['default3.png', 'default4.png', 'default5.png', 'default6.png', 'default7.png', 'default8.png'],
    //these are all of the possible icons to choose from
    getIcon: function(player) {
        return this.icon[player ? 0 : 1];
    },
    //returns the location to look for the icon depending on player
    setIcon: function(player, icon) {
        if ((this.icon[player] == this.iconPossibles[icon]) || (this.icon[(player === 0 ? 1 : 0)] == this.iconPossibles[icon])) {
            //if the one we are setting it to is the one set or if the one we are setting it to is the other players then just dont set it
            return;
        }
        var tmp = this.icon[player]; //stores curicon

        this.icon[player] = this.iconPossibles[icon]; //sets curicon to newicon

        this.iconPossibles[icon] = tmp; //sets new icon to old icon

        tmp = null;
        settings.set({
            player1: game.player1Name,
            player2: game.player2Name,
            iconPossibles: game.iconPossibles,

        });
        settings.set('player', player === 0 ? 1 : 0);
        this.updateHUD();
    },
    //sets the location to look for icons
    save: function() {
        //save turn, save current moves, add last board state to moves, save names, save icons, save scores
        if (!supportsLocalStorage()) {
            return false;
        }

        localStorage.isPlaying = this.moves.length > 0 ? true : false;
        //store things if game is in progress
        localStorage.setObj('board', game.board);
        localStorage.turn = this.turns;
        localStorage.setObj('moves', this.moves);
        localStorage.setObj('icons', [game.icon, game.iconPossibles]);


    },
    //Saves current state of the game each change that has been made to continue game later
    moves: [],
    //contains all moves within a game for storage and playback on reset, first element contains the initial board on which to apply the moves, moves.length+4 is how many turns passed in the game
    storeMoves: function(from, to) {

        this.moves.push([from, to]);
        this.save();

    },

    load: function() {
        if (!supportsLocalStorage() || !(localStorage.isPlaying)) {
            return false;
        }
        this.board = localStorage.getObj('board');
        console.log(this.board);
        console.log(game.board);
        this.turns = this.toInt(localStorage.turn);
        this.moves = localStorage.getObj('moves');
        this.icon = localStorage.getObj('icons')[0];
        this.iconPossibles = localStorage.getObj('icons')[1];
        var players = localStorage.getObj('players');
        if (players !== null) {
            this.setName(true, players[0]);
            this.setName(false, players[1]);
            this.score = players[2];
        }
        return true;

    },
    //loads last game played at last saved positions

    updateHUD: function() {
        this.trackcurrent(this.board);
        /*this.wipeBoard();
        this.fillBoard();*/
        ractive.update();
        settings.update();
        settings.set({
            player1: game.player1Name,
            player2: game.player2Name
        });
        ractive.set({
            board: game.board,
            turn: game.turns > 5,
            turns: game.turns,
            player1: game.player1Name,
            player2: game.player2Name,
            icon: game.icon,
            moveables: [],
        });
    },
    //updates HUD to current values

    score: [0, 0],
    //scores of the two players

    saveScore: function(player) {
        this.score[player ? 0 : 1] += 1;
        //saves scores into scorearr
        ractive.update('scores');

        if (localStorage.getObj('players') === null) {
            localStorage.setObj('players', [game.player1Name, game.player2Name, game.score]);
        } else {
            var players = localStorage.getObj('players');
            for (var i = 0, l = localStorage.length; i < l; i + 3) {
                if (players[i] == this.player1Name && players[i + 1] == this.player2Name) {
                    players[i + 2][player ? 0 : 1] += 1;
                    localStorage.setObj('players', players);
                    return;
                }
            }
            localStorage.setObj('players', [game.player1Name, game.player2Name, game.score].push(localStorage.getObj('players')));
        }
    },

    newGame: function(player) {
        this.saveScore(player);
        this.init();
        this.updateHUD();
    },
    //Resets all settings to default and updates HUd to reflect a wiped game

    speed: 1500,
    //Set how long the message stay

    animationIsGoing: false,
    //to prevent browser eagerclick

    illegal: function(errorMsg) {
        if (this.animationIsGoing) {
            return;
        }
        this.animationIsGoing = true;
        console.log(errorMsg);
        $('#messageArea').text(errorMsg);
        $('#messageArea').slideDown('slow', function() {
            $('#messageArea').delay(game.speed).slideUp('slow', function() {
                $('#messageArea').text('');
                game.animationIsGoing = false;
            });

        });
    },
    //something illegal happened

    illegalMovements: [
        [2, 5, 6, 7, 8],
        [3, 5, 6, 7, 8],
        [0, 3, 6, 7, 8],
        [1, 2, 5, 7, 8],
        [],
        [0, 1, 3, 6, 7],
        [0, 1, 2, 5, 8],
        [0, 1, 2, 3, 5],
        [0, 1, 2, 3, 6]
    ],
    //All Impossible movements by index

    winningArrangements: [
        [0, 4, 8],
        [1, 4, 7],
        [2, 4, 6],
        [3, 4, 5]
    ],
    //All possible Winning arangements to check against

    illegalArrangements: [
        [0, 3, 6],
        [2, 5, 8],
        [0, 1, 2],
        [6, 7, 8]
    ],
    //These arrangements including winningArrangements are illegal in rounds 6-12 if these are encountered the other player wins and a notification as to why is given

    allPosMoveLocs: [
        [1, 3, 4],
        [0, 2, 4],
        [1, 4, 5],
        [0, 4, 6],
        [0, 1, 2, 3, 5, 6, 7, 8],
        [2, 4, 8],
        [3, 4, 7],
        [4, 6, 8],
        [4, 5, 7]
    ],
    //for the index inputted into this array all pssible locations for that position on the corresponding space on the board is given

    corners: [0, 2, 6, 8],
    //Self explanatory

    edges: [1, 3, 5, 7],
    //includes corners

    center: 4,
    //center being the best position to have when playing

    pairArrangements: [
        [0, 8],
        [1, 7],
        [2, 6],
        [3, 5],
        [0, 4],
        [4, 8],
        [1, 4],
        [4, 7],
        [2, 4],
        [4, 6],
        [3, 4],
        [4, 5]
    ],
    //no specific order, go through this and if any of these match try to check with next

    pairCompleter: [
        [1, 2, 3, 5, 6, 7],
        [0, 2, 3, 5, 6, 8],
        [0, 1, 3, 5, 7, 8],
        [0, 1, 2, 6, 7, 8],
        [5, 7],
        [1, 3],
        [6, 8],
        [0, 2],
        [3, 7],
        [1, 5],
        [2, 8],
        [0, 6]
    ],
    //corresponding to previos pairArrangements var these are the positions to check to see if it can make a line through center

    prefferedLocs: [0, 2, 6, 8, 3, 1, 7, 5],
    //preffered locations for placing into board 4 is checked seperately

    trapArrangements: [
        [
            [0, 2, 4],
            [1, 3, 5]
        ],
        [
            [0, 4, 6],
            [1, 3, 7]
        ],
        [
            [2, 4, 8],
            [1, 5, 7]
        ],
        [
            [4, 6, 8],
            [3, 5, 7]
        ]
    ],
    //arrangements for trapping [0] is the other player who needs to move [1] is player checking

    ifCanTrap: function(player, board) {
        var myplayer = this.findPlayersPosIn(player, board).sort(compareNumber),
            myOpponent = this.findPlayersPosIn(!player, board).sort(compareNumber);

        for (var r = 0, rl = this.trapArrangements.length; r < rl; r++) {
            var to = this.twoOutOfThree(this.trapArrangements[r][1], myplayer);

            if (to > -1 && this.arraysEqual(this.trapArrangements[r][0], myOpponent)) {


                for (var c = 0, cl = this.allPosMoveLocs[to].length; c < cl; c++) {
                    if (board[this.allPosMoveLocs[to][c]] == player) {
                        this.moveFromTo(player, this.allPosMoveLocs[to][c], to);
                        return true;
                    }
                }

            }

        }
        return false;
    },
    //tests if the player can trap the other player within a board
    arraysEqual: function(arr1, arr2) {
        if (arr1.length !== arr2.length) {
            return false;
        }
        for (var i = arr1.length; i--;) {
            if (arr1[i] !== arr2[i]) {
                return false;
            }
        }

        return true;
    },
    //if two arrays are equal returns true
    twoOutOfThree: function(arr1, arr2) {
        var count = 0,
            c = 0;
        for (var i = arr1.length; i--;) {
            if (arr1[i] !== arr2[i]) {
                count++;
                c = i;
            }
        }

        return count == 1 ? arr1[c] : -1;
    },
    //if two arrays are equal returns true
    choosePreffered: function(board) {
        if (board[this.center] === null) {
            return this.center;
        }
        var pos = this.toInt(Math.random() * this.prefferedLocs.length);
        if (board[this.prefferedLocs[pos]] !== null) {
            this.choosePreffered(board);
        }
        return this.prefferedLocs[pos];
    },
    //chooses preffered location randomly returns integer position of empty space to put into
    toInt: function(inter) {
        return parseInt(inter, 10);
    },
    //converts to int

    hasPossibleLineIn: function(player, board) {
        if (this.hasCenterIn(player, board)) {
            var pos = this.findPlayersPosIn(player, board);
            for (var i = 0, l = pos.length; i < l; i++) {
                if (pos[i] !== this.center) {
                    for (var val = 4, lval = this.pairArrangements.length; val < lval; val++) {
                        if (board[this.pairArrangements[val][0]] == player && board[this.pairArrangements[val][1]] == player) {
                            if (val % 2 === 0) {
                                if (board[this.pairArrangements[val + 1][1]] === null) {
                                    return val;
                                }
                            } else {
                                if (board[this.pairArrangements[val - 1][0]] === null) {
                                    return val;
                                }
                            }
                        }
                    }
                }
            }

        }

        for (var il = 0, p = this.pairArrangements, b = board, le = p.length; il < le; il++) {

            if (b[p[il][0]] == player && b[p[il][1]] == player) {
                //board positions value==player continue to check next
                return il;
            }

        }
        return 12;
    },
    //player is player board is in what board, returns the index at which the pairArrangment is found or 12 if none is found if the player being questioned has two in a line on the board

    hasCenterIn: function(player, board) {
        return player == board[this.center];
    },
    //returns true if specified player has the center of specified board

    isWinIn: function(player, board) {

        var pos = this.findPlayersPosIn(player, board).sort(compareNumber);

        if (pos[0] > 3) {
            return false;
        }

        var cur = this.winningArrangements[pos[0]];

        if (cur[1] == pos[1] && cur[2] == pos[2]) {
            return true;
        }
        return false;

    },
    //returns true if specified player has a line through the center in the specified board

    hasIllegalLineIn: function(player, board) {

        for (var i = 0, b = board, line = this.winningArrangements.concat(this.illegalArrangements), l = line.length; i < l; i++) {
            if (b[line[i][0]] == player && b[line[i][1]] == player && b[line[i][2]] == player) {
                return true;
            }
        }

        return false;
    },

    canCompleteALineIn: function(player, board) {

        var pairArrOutPut = this.hasPossibleLineIn(player, board);

        if (pairArrOutPut == 12) {
            return false;
        } else if (board[this.center] === null && (pairArrOutPut < 4)) {
            return true;
        } else if (board[this.pairCompleter[pairArrOutPut][0]] == player || board[this.pairCompleter[pairArrOutPut][1]] == player && board[this.pairArrangements[(pairArrOutPut % 2) === 0 ? pairArrOutPut + 1 : pairArrOutPut - 1][(pairArrOutPut % 2) === 0 ? 1 : 0]] === null) {
            return true;
        }
        return false;
    },
    //returns true if the specified player can complete a line with in the given board in one move
    completeLineIn: function(player, board) {
        var pairArrOutPut = this.hasPossibleLineIn(player, board);

        var possibles = this.findPlayersPosIn(player, board);
        for (var i = 0, l = possibles.length; i < l; i++) {
            if (possibles[i] !== this.pairArrangements[pairArrOutPut][0] && possibles[i] !== this.pairArrangements[pairArrOutPut][1]) {
                if (board[this.center] === null && (pairArrOutPut < 4)) {
                    this.moveFromTo(player, possibles[i], this.center);
                    this.turns = 0;
                    return;
                }

                this.moveFromTo(player, possibles[i], this.pairArrangements[(pairArrOutPut % 2) === 0 ? pairArrOutPut + 1 : pairArrOutPut - 1][(pairArrOutPut % 2) === 0 ? 1 : 0]);
                this.turns = 0;

            }
        }

    },
    completeLineAgainst: function(player, board) {
        var pairArrOutPut = this.hasPossibleLineIn(!player, board);
        //console.log("Output is at %s", pairArrOutPut);
        if (pairArrOutPut < 4) {
            //console.log("Focus on center");
            //steal center
            if (board[this.center] === null) {
                var positions = this.findPlayersPosIn(player, board);
                for (var i = 0, l = positions.length; i < l; i++) {
                    if (this.hasPossibleLineIn(player, this.hypotheticalMoveInFromTo(player, board, positions[i], this.center))) {
                        this.moveFromTo(player, positions[i], this.center);
                        return true;
                    }
                }
                this.moveFromTo(player, positions[2], this.center);
                return true;
            }
        } //console.log("Guess it wasn't in the center");
        if (board[this.pairCompleter[pairArrOutPut][0]] == player || board[this.pairCompleter[pairArrOutPut][1]] == player) {
            //console.log("From %s to %s Please",board[this.pairCompleter[pairArrOutPut][0]]==player?this.pairCompleter[pairArrOutPut][0]:this.pairCompleter[pairArrOutPut][1],this.pairArrangements[(pairArrOutPut%2)===0?pairArrOutPut+1:pairArrOutPut-1][(pairArrOutPut%2)===0?1:0]);

            this.moveFromTo(player, board[this.pairCompleter[pairArrOutPut][0]] == player ? this.pairCompleter[pairArrOutPut][0] : this.pairCompleter[pairArrOutPut][1], this.pairArrangements[(pairArrOutPut % 2) === 0 ? pairArrOutPut + 1 : pairArrOutPut - 1][(pairArrOutPut % 2) === 0 ? 1 : 0]);
            return true;
        }
        return false;
    },
    canMoveInTo: function(player, board, pos) {
        if (pos == this.center && board[this.center] === null) {
            return true;
        }

        if (board[pos] === null) {

            for (var i = 0, possibleLocs = this.allPosMoveLocs[pos], l = possibleLocs.length, aboard = board; i < l; i++) {

                if (aboard[possibleLocs[i]] == player) {
                    return true;
                }

            }
        }

        return false;

    },
    //returns true if player can move into a loc within a board
    findPlayersPosIn: function(player, board) {
        var arr = [],
            c = 0;
        for (var i = 0, aboard = board, l = aboard.length; i < l; i++) {
            if (aboard[i] == player) {
                arr[c] = i;
                c++;
            }
        }
        return arr;
    },
    //returns where the players pieces are located within a board

    canMoveFromTo: function(player, board, from, to) {
        if (board[to] === null && board[from] == player && (from == this.center || this.allPosMoveLocs[from][0] == to || this.allPosMoveLocs[from][1] == to || this.allPosMoveLocs[from][2] == to)) {
            return true;
        }
        return false;
    },
    //returns true if player in board can move from pos to pos

    changeBetween: function(prev, newy) {
        var re = [];
        for (var p = 0, pl = prev.length; p < pl; p++) {

            if (prev[p] === null && prev[p] !== newy[p]) {
                re[1] = p;
            }
            if (prev[p] !== null && prev[p] !== newy[p]) {
                re[0] = p;
            }

        }
        return re;
    },
    //returns the changebetween two boards returned in format [from,to]

    getPossibleBoardArrangementsFrom: function(player, board) {
        var arr = [];
        for (var i = 0, piecesPos = this.findPlayersPosIn(player, board), l = piecesPos.length; i < l; i++) {

            for (var m = 0, moveLocs = this.allPosMoveLocs[piecesPos[i]], length = moveLocs.length; m < length; m++) {
                if (this.canMoveFromTo(player, board, piecesPos[i], moveLocs[m])) {
                    var curBoard = this.hypotheticalMoveInFromTo(player, board, piecesPos[i], moveLocs[m]);
                    //this.trackcurrent(curBoard);
                    arr.push(curBoard);
                }
            }

        }
        return arr;

    },
    //returns an array of possible board arrangements

    rankBoard: function(player, board) {
        var rank = 0;
        if (this.canCompleteALineIn(player, board)) {
            rank += 50;
        }
        if (this.canCompleteALineIn(!player, board)) {
            rank -= 400;
        }
        if (this.isWinIn(player, board)) {
            rank += 400;
        }
        if (this.isWinIn(!player, board)) {
            rank -= 200;
        }
        if (this.hasPossibleLineIn(player, board) !== 12) {
            rank += 10;
        }
        if (this.hasPossibleLineIn(!player, board) !== 12) {
            rank -= 10;
        }
        if (this.hasCenterIn(player, board)) {
            rank += 15;
        }
        if (this.hasCenterIn(!player, board)) {
            rank -= 10;
        }
        //this.trackcurrent(board);
        //console.log("Rank of: "+rank+", For: "+this.getName(player)+" As: "+(player?'X':'O'));
        return rank;
    },
    //ranks board arrangement returns an interger logs rank to console
    trackcurrent: function(board) {
        var bro = "",
            brt = "",
            br = "";
        for (var i = 0, l = board.length; i < l; i++) {
            if (i / 3 < 1) {
                bro += board[i] ? ' X ' : board[i] === null ? ' ' + i + ' ' : ' O ';
            } else if (i / 3 < 2) {
                brt += board[i] ? ' X ' : board[i] === null ? ' ' + i + ' ' : ' O ';
            } else {
                br += board[i] ? ' X ' : board[i] === null ? ' ' + i + ' ' : ' O ';
            }
        }
        console.log('---------');
        console.log(bro);
        console.log(brt);
        console.log(br);
        console.log('---------');
    },
    //logs current board to console
    placePiece: function(player, pos) {
        if (this.justWon) {
            this.justWon = false;
            //this is for browser clicking
            return false;
        }
        if (this.turns > 5) {
            return false;
        }
        if (this.board[pos] === null && (this.hasIllegalLineIn(player, this.hypotheticalMoveInFromTo(player, this.board.clone(), pos, pos)) === false)) {
            this.board[pos] = player;
            this.turns++;
            this.updateHUD();
            if (this.turns == 5) {
                this.moves[0] = this.board;
            }
            return true;
        }
        this.illegal("Sorry that space is filled!");
        return false;
    },
    //places Piece in Board if possible
    aiTurn: function() {

        if (this.turns > 5) {

            this.chooseBestMove();

        } else {

            this.placePiece(false, this.choosePreffered(this.board));

        }
        this.updateHUD();
    },
    //AI's turn invoked after the user does their turn
    chooseBestMove: function(player, board) {
        if (this.canCompleteALineIn(player, board)) {
            //complete the line then!
            console.log("Let's Complete A line!");
            this.completeLineIn(player, board);
            return;
        } else if (this.canCompleteALineIn(!player, board)) {
            //block that!!
            console.log("Let's try to block em!");
            if (this.completeLineAgainst(player, board)) {
                console.log("We Blocked them!");
                return;
            }
            console.log("I think we may Lose that next turn :(");
        } else if (this.ifCanTrap(player, board)) {
            console.log("We Trapped E'm");
            return;
        }

        var InitialMovesPossible = this.trimArrangements(player, this.getPossibleBoardArrangementsFrom(player, this.board)),
            OpponentsPossibleMoves = [],
            playersFutureMoves = [],
            initialMoveRankings = [],
            opponentMoveRankings = [],
            futureMoveRankings = [];

        if (InitialMovesPossible.length === 0) {

            this.moveIntoAnyOpenPos(player);
            console.log("Welp We Lost :(");
            return;

        } else if (InitialMovesPossible.length == 1) {

            //just skip we will move into that position that is possible now
            console.log("Only one position to move to really :/");

        } else {

            for (var first = 0, firstLength = InitialMovesPossible.length; first < firstLength; first++) {
                //console.log("Working the first round for the %s time",first+1);
                //goes through first set


                OpponentsPossibleMoves.push(this.getPossibleBoardArrangementsFrom(!player, InitialMovesPossible[first]));

                //console.log("Calculated and stored OpponentsPossibleMoves");

                initialMoveRankings.push([this.rankBoard(player, InitialMovesPossible[first]), first]);

                //console.log("Storing first rank for the %s time!",first);


                for (var second = 0, secondLength = OpponentsPossibleMoves[first].length; second < secondLength; second++) {


                    //console.log("Looking through second possiblities for the %s time the length is %s",second, secondLength);
                    playersFutureMoves.push(this.trimArrangements(player, this.getPossibleBoardArrangementsFrom(player, OpponentsPossibleMoves[first][second])));

                    //console.log("Calculated and stored possibilities of Player for the %s time!",second);

                    opponentMoveRankings.push([this.rankBoard(!player, OpponentsPossibleMoves[first][second]), first]);

                    //console.log("Stored second rank at %s and %s",first,second);

                    for (var third = 0, thirdLength = playersFutureMoves[second].length; third < thirdLength; third++) {
                        futureMoveRankings.push([this.rankBoard(player, playersFutureMoves[second][third]), first]);
                        //console.log("Stored third rank at %s and %s and %s, with %s to go",first,second,third,thirdLength-third-1);


                    }


                }


            }
            //console.log("We made it through that madness!!");
        }

        var
        /*AverageOfInitialMoves = this.averageArr(initialMoveRankings),
                    save = this.averageArr(opponentMoveRankings),*/
            sortedRanks = initialMoveRankings.clone().sort(compareNumbers),
            sec = opponentMoveRankings.clone().sort(compareNumbers),
            change = [];



        if (InitialMovesPossible.length > 1 && (sortedRanks[sortedRanks.length - 1][0]) > 0) {

            //benefits the AI to Play for itself
            var firstBestMove = sortedRanks[sortedRanks.length - 1][1];
            var secondBestMove = sortedRanks[sortedRanks.length - 2][1];


            if (this.findBestAverage(firstBestMove, futureMoveRankings) > this.findBestAverage(secondBestMove, futureMoveRankings)) {
                change = this.changeBetween(this.board, InitialMovesPossible[firstBestMove]);

            } else {
                change = this.changeBetween(this.board, InitialMovesPossible[secondBestMove]);
            }


        } else if (InitialMovesPossible.length == 1) {
            change = this.changeBetween(this.board, InitialMovesPossible[0]);
        } else {
            //screw the player
            console.log("Let's screw e'm up!");
            //console.log(opponentMoveRankings);
            //console.log(sec);

            var worstPlayForOpponent = this.findInArrOfArrs(sec[0][0], opponentMoveRankings);
            var secondWorstPlayForOp = this.findInArrOfArrs(sec[1][0], opponentMoveRankings);


            //console.log("Worst Play is at %s with a ranking of %s and board config ",worstPlayForOpponent,initialMoveRankings[worstPlayForOpponent][0]);
            //this.trackcurrent(InitialMovesPossible[worstPlayForOpponent]);

            //console.log("Compared To:");

            //console.log("Second Worst Play is at %s with a ranking of %s and board config ",secondWorstPlayForOp,initialMoveRankings[secondWorstPlayForOp][0]);
            //this.trackcurrent(InitialMovesPossible[secondWorstPlayForOp]);

            change = initialMoveRankings[worstPlayForOpponent][0] > initialMoveRankings[secondWorstPlayForOp][0] ? this.changeBetween(this.board, InitialMovesPossible[worstPlayForOpponent]) : this.changeBetween(this.board, InitialMovesPossible[secondWorstPlayForOp]);
            //console.log(change);
            //console.log("Lets do that move!");


        }
        this.moveFromTo(player, change[0], change[1]);

    },
    //chooses Best Location to move to for a player
    trimArrangements: function(player, board) {
        var boardy = board.clone(),
            bool = this.turns < 12;
        for (var i = boardy.length; i--;) {
            if (this.canCompleteALineIn(!player, boardy[i]) || (bool && this.hasIllegalLineIn(player, boardy[i])) || this.isSameMoveAsLastTime(player, boardy[i])) {
                boardy.splice(i, 1);
            }
        }
        return boardy;
    },
    //trims down unneccesary arrangements
    isSameMoveAsLastTime: function(player, board) {
        var moves = this.moves,
            l = moves.length - 2,
            change = this.changeBetween(this.board, board);
        if (moves[l][0] == change[1] && moves[l][1] == change[0]) {
            return true;
        }
        return false;
    },
    findBestAverage: function(choiceInFirstRound, thirdRoundArr) {
        var c = 0,
            b = 0;

        for (var i = 0, playersFutureMoves = thirdRoundArr, l = playersFutureMoves.length; i < l; i++) {
            if (playersFutureMoves[i][1] == choiceInFirstRound) {
                c += playersFutureMoves[i][0];
                b++;
            }
        }
        return this.toInt(c / b);
    },
    averageArr: function(arr) {
        var c = 0,
            b = 0;
        for (var i = 0, array = arr, l = array.length; i < l; i++) {
            c += array[i][0];
            b++;
        }

        return this.toInt(c / b);

    },
    //averages ranks for choose best move
    moveIntoAnyOpenPos: function(player) {

        var possibles = this.findPlayersPosIn(player, this.board);

        for (var i = 0; i < possibles.length; i++) {

            if (this.board[this.allPosMoveLocs[possibles[i]][0]] === null) {
                this.moveFromTo(player, possibles[i], this.allPosMoveLocs[possibles[i]][0]);
                return;
            }
            if (this.board[this.allPosMoveLocs[possibles[i]][1]] === null) {
                this.moveFromTo(player, possibles[i], this.allPosMoveLocs[possibles[i]][1]);
                return;
            }
            if (this.board[this.allPosMoveLocs[possibles[i]][2]] === null) {
                this.moveFromTo(player, possibles[i], this.allPosMoveLocs[possibles[i]][2]);
                return;
            }

        }

    },
    findInArrOfArrs: function(num, arr) {
        for (var r = 0, lr = arr.length; r < lr; r++) {

            if (arr[r][0] == num) {
                return arr[r][1];
            }

        }
    }
};
var ractive, settings;

function buildractive() {
        ractive = new Ractive({
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
                isActive: function(num) {
                    for (var i = 0; i < this.get('moveables').length; i++) {

                        if (num == this.get('moveables')[i]) {
                            return true;
                        }
                    }

                    return false;
                }


            }
        });
        settings = new Ractive({
            el: 'settingsPage',
            template: '#settings',
            data: {
                player1: game.player1Name,
                player2: game.player2Name,
                icon: game.icon,
                iconPossibles: game.iconPossibles,
                player: 0,
            }
        });
        settings.observe('player1', function(newValue, oldValue) {
            game.setName(newValue, true);
            settings.set('player1', newValue);
            settings.update();
        });
        settings.observe('player2', function(newValue, oldValue) {
            game.setName(newValue, false);
            settings.set('player2', newValue);
            settings.update();
        });
    }
    /*
    function makeEm() {

        $('.draggable').draggable({
            helper: function(ev, ui) {
                if ($(this).text() !== (game.turns % 2)) {
                    //if its not that players turn give them nothing to drop;
                    return "<div></div>";
                }
                return "<span class='helperPick'>" + $(this).html() + "</span>";

            },
            cursor: "pointer",
            cursorAt: {
                left: $('.drop').width() / 2,
                top: $('.drop').width() / 2
            }
        });

        $(".drop").droppable({
            accept: ".draggable",
            drop: function(event, ui) {

                if ($(this).children(".draggable").size() > 0 /*|| if not players truen* ) {

                    //cant aready something there
                    return false;

                } else {

                    game.moveFromTo($(this), $(ui.draggable), false);

                }

            }
        });

    }*/
buildractive();
game.init();
$(document).ready(function() {
    $(".ripplelink").click(function(e) {

        if ($(this).find(".ink").length === 0) {
            $(this).prepend("<span class='ink'></span>");
        }

        var ink = $(this).find(".ink");
        ink.removeClass("animate");

        if (!ink.height() && !ink.width()) {
            var d = Math.max($(this).outerWidth(), $(this).outerHeight());
            ink.css({
                height: d,
                width: d
            });
        }

        var x = e.pageX - $(this).offset().left - ink.width() / 2;
        var y = e.pageY - $(this).offset().top - ink.height() / 2;

        ink.css({
            top: y + 'px',
            left: x + 'px'
        }).addClass("animate");
    });
    $('.game').click(function() {
        goTo('#gameBoard', '.game');
    });
    $('.settings').click(function() {
        goTo('#settingsPage', '.settings');
    });
    $('.rules').click(function() {
        goTo('#rules', '.rules');
    });
});
game.setName("Juan Peperoni", true);
game.setName("El Che de Barrio", false);
/*game.placePiece(true, 2);
game.placePiece(false, 1);
game.placePiece(true, 4);
game.placePiece(false, 0);
game.placePiece(true, 7);
game.placePiece(false, 8);
game.moveFromTo(true, 2, 5);
/*game.moveFromTo(false, 0, 3);
console.time("Lets see how long it takes");
game.chooseBestMove(true, game.board);
console.timeEnd("Lets see how long it takes");
var c = 0;
while (game.turns !== 0 && c < 10) {
    game.chooseBestMove(c % 2 == 1, game.board);
    c++;
}
console.log("It took %s rounds to win using the AI against itself!", game.toInt(c / 2));
*/
