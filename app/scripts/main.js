var game, settings;


function resetMe() {
    game.illegal('Reset Complete!');
    game.set("turns", 0);
    localStorage.clear();
    game.set("justWon", true);
    game.initer();
    game.set("justWon", false);
    game.update();
    game.save();
    game.set("score", [0, 0]);
    game.updateHUD();
}

function setAI() {
    game.set("ai", $('#ai').is(':checked'));
    if ((game.get("player"))) {
        //if is player2 do the ai turn instead
        game.aiTurn();
    }
    settings.set('ai', game.ai);
}

function setName(player) {
    var str = $('#' + (player ? 'player1' : 'player2')).val();
    settings.set(player ? 'player1' : 'player2', str);
    game.setName(str, player);
}


function drop(ev) {
    ev.preventDefault();
    game.set("justWon", false);
    if (ev.dataTransfer.getData("which")) {
        var drag = game.toInt(ev.dataTransfer.getData("which")),
            dropp = game.toInt(ev.target.id.replace(/^\D+/g, ""));
        game.moveFromTo(game.get("board")[drag], drag, dropp);
    }

}


var game, settings;



function buildgame() {
    game = new Game({
        el: 'gameBoard',
        template: '#template',
        data: {}
    });
    settings = new Ractive({
        el: 'settingsPage',
        template: '#settings',
        oninit: function() {
            this.observe('player1', function(newValue, oldValue) {
                if (newValue && game) {
                    game.setName(newValue, true);
                    this.update();
                }
            });
            this.observe('player2', function(newValue, oldValue) {
                if (newValue && game) {
                    game.setName(newValue, false);
                    this.update();
                }
            });
            this.on("choosePlayer", function(event, val) {
                this.set("player", val);
            });
            this.on("setIcon", function(event, params) {
                params = params.split(":");
                this.set(game.setIcon(params[0] == "true" ? 1 : 0, game.toInt(params[1])));
            })
        },
        data: {
            player1: game.get("player1Name"),
            player2: game.get("player2Name"),
            icon: game.get("icon"),
            iconPossibles: game.get("iconPossibles"),
            player: false,
            ai: game.get("ai"),
        }
    });

}

function dragAndDrop() {
    var hadnt = true;
    $('.draggable').draggable({
        containment: $('#gameBoard'),
        cursor: "pointer",
        opacity: 0.8,
        revert: function(dropped) {
            //if it is not the players turn then send the draggable to where it was
            if ((game.get("board")[game.toInt($(this).attr('id').replace(/^\D+/g, ""))] !== null) || !dropped) {
                game.set("dontSelect", game.get("board")[game.toInt($(this).attr('id').replace(/^\D+/g, ""))] !== null);
                return true;
            }

            return false;
        },
        revertDuration: 1000,
        delay: 200,
        zIndex: 120,
        drag: function(event, ui) {
            if (hadnt) {
                $(this).parent().parent().removeClass('overHide');
                hadnt = false;
                if (game.get('selected') > -1) {
                    $(this).removeClass('Active');
                    game.set('selected', -1);
                    game.set('moveables', []);
                }
            }

        }
    });

    $(".drop").droppable({

        accept: ".draggable",
        tolerance: "pointer",
        drop: function(event, ui) {
            var dropNum = game.toInt($(this).attr('id').replace(/^\D+/g, "")),
                dragNum = game.toInt($(ui.draggable).attr('id').replace(/^\D+/g, ""));
            $(this).removeClass('Active');
            if ((game.get("player")) !== game.get("board")[dragNum]) {
                game.illegal("Sorry " + game.getName(game.get("board")[dragNum]) + ", it's " + game.getName(!game.get("board")[dragNum]) + "'s turn!");
                return false;
            } else if (dragNum == dropNum) {
                return false;
            } else if (game.get("board")[dropNum] !== null) {
                //Something there
                game.illegal('Something already there!');
                return false;
            } else if (!game.canMoveFromTo(game.get("board")[dragNum], game.get("board").clone(), dragNum, dropNum)) {

                game.illegal("Sorry that's too far to move to!");
                return false;

            } else {

                game.moveFromTo(game.get("player"), dragNum, dropNum);

            }


        },
        over: function(event, ui) {
            $(this).addClass('Active');
        },
        out: function(event, ui) {
            $(this).removeClass('Active');
        },
    });
    if (game.get("turns") < 6) {
        $('.draggable').draggable("disable");
        return;
    }
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
}
buildgame();
$(document).ready(function() {

    $('.game').click(function() {
        goTo('#gameBoard', '.game');
    });
    $('.settings').click(function() {
        goTo('#settingsPage', '.settings');
    });
    $('.rules').click(function() {
        goTo('#rules', '.rules');
    });
    $(function() {
        FastClick.attach(document.body);
    });
    dragAndDrop();
    if (document.location.hash) {
        var which = [
            ['g', '.game'],
            ['s', '.settings'],
            ['r', '.rules']
        ];
        console.log(document.location.hash);
        for (var i = which.length;; i--) {
            if ((document.location.hash + "").slice(1, 2) == which[i - 1][0]) {
                goTo(document.location.hash, which[i - 1][1]);
                break;
            }
        }
    }
});
