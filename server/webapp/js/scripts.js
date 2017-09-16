// TODO: DB: participant image

function pollParticipants() {
    console.log("Polling participants...");

    $.getJSON('http://hungergames-vested-mayfly.scapp.io/pollAllParticipants', function (participants) {
        // clear existing participants
        $("#participants").empty();
        $("#challenges").empty();

        // go through participants
        console.log("Num participants " + participants.length);

        for (i = 0; i < participants.length; i++) {
            var participant = participants[i];

            // Create the participant div
            $("#participants").append(
                "<div id=\"" + participant.id + "\" class=\"sportler\" onclick=\"participantClicked(this)\">" +
                "<div class=\"runner-img\"><img src=\"" + participant.image + "\"></div>" +
                "<span class=\"rank\">" + participant.rank + "</span> " +
                "<span class=\"name\">" + participant.name + "</span>" +
                "<span class=\"speed\">" + participant.speed + "</span>" +
                "</div>");

            // Create the challenge divs
            var participantSelected = "";

            if (i == 0) {
                participantSelected = "selected"
            } else {
                participantSelected = "not-selected"
            }

            $("#challenges").append(
                "<div id=\"" + participant.id + "Challenges\" class=\"card \" + participantSelected +>" +
                "<h1>Ongoing Challenges</h1>" +
                "<div id=\"" + participant.id + "ChallengesBlock\" class=\"card-block \">" +
                "</div>" +
                "<button class=\"btn sml blue card-btn\" id=\"newChallenge\" onclick=\"newChallenge(" + participant + ")\">New Challenge</button>" +
                "</div>"
            );

            $.getJSON('http://hungergames-vested-mayfly.scapp.io/pollParticipantChallanges/' + participant.id, function (challenges) {
                for (i = 0; i < challenges.length; i++) {
                    var challenge = challenges[i];

                    $("#" + participant.id + "ChallengesBlock").append(
                        "<div class=\"challenge " + challenge.status + "\">" +
                        "<span class=\"name\">" + challenge.task + "</span>" +
                        "</div>"
                    );
                }
            });
        }

        setTimeout(pollParticipants, 1000);
    });
}

$('.challenge-option').click(function (e) {
    console.log("likes");
    $('.challenge-option').removeClass('selected');
    $(e.target).addClass('selected');
});

setTimeout(function () {
    $('.twitter-timeline').height('100%');
}, 2500);

function participantClicked(event) {
    var caller = event.target;

    if ($("" + caller.id).get(0).classList.contains("selected")) {
        $("" + caller.id).get(0).classList.toggle("selected");
        $("" + caller.id).get(0).classList.toggle("not-selected");
    }
}

function newChallenge(participant) {
    $("#selectedChallenge").empty();

    $("#selectedChallenge").append(
        "<div class=\"card-content text-center\" id=\"challenge\">" +
        "<div class=\"challenge-img\"><img src=\"" + participant.image + "\"></div>" +
        "<span id=\"runner\">Challenge " + participant.name + " to</span>" +
        "<div class=\"challenge-option\">Sprint 500m</div>" +
        "<div class=\"challenge-option\">Stand still for 20 seconds</div>" +
        "<div class=\"challenge-option\">Overtake next oponent</div>" +
        "<span style=\"font-size: 18px\"> for CHF </span>" +
        "<div class=\"subline-input-wrapper\"><input type=\"text\" class=\"subline-input\" value=\"500\"></div>" +
        "<button class=\"btn sml blue card-btn\" id=\"startChallenge\" onclick=\"startChallenge()\">Go!</button>" +
        "</div>"
    );
}

function startChallenge() {

}