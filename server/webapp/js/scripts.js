function pollParticipants() {
    var participants;

    $.getJSON('http://hungergames-vested-mayfly.scapp.io/pollAllParticipants', function (participantsResponse) {
        // identify selected participant
        var selectedParticipantId = undefined;

        if ($(".card.selected") && $(".card.selected").length > 0) {
            selectedParticipantId = $(".card.selected").get(0).id;
        }

        // clear existing participants
        $("#participants").empty();
        $("#challenges").empty();

        // go through participants
        participants = participantsResponse;

        for (i = 0; i < participants.length; i++) {
            var participant = participants[i];

            // Create the participant div
            $("#participants").append(
                "<div id=\"" + participant.id + "\" class=\"sportler\" onclick=\"participantClicked('" + participant.id + "')\">" +
                "<div class=\"runner-img\"><img src=\"" + participant.image + "\"></div>" +
                "<span class=\"rank\">" + participant.rank + "</span> " +
                "<span class=\"name\">" + participant.name + "</span>" +
                "<span class=\"speed\">" + participant.speed + " km/h</span>" +
                "</div>");

            // Create the challenge divs
            var participantSelected = "";

            if (selectedParticipantId) {
                if (participant.id + "Challenges" == selectedParticipantId) {
                    participantSelected = "selected"
                } else {
                    participantSelected = "not-selected"
                }
            } else {
                if (i == 0) {
                    participantSelected = "selected"
                } else {
                    participantSelected = "not-selected"
                }
            }

            $("#challenges").append(
                "<div id=\"" + participant.id + "Challenges\" class=\"card " + participantSelected + "\">" +
                "<h1>Ongoing Challenges of " + participant.name + "</h1>" +
                "<div id=\"" + participant.id + "ChallengesBlock\" class=\"card-block \">" +
                "</div>" +
                "<button class=\"btn sml blue card-btn\" id=\"newChallengeButton\" onclick=\"newChallenge('" + JSON.stringify(participant).replace(/\"/g, "$") + "')\">New Challenge</button>" +
                "</div>"
            );
        }
    }).done(function () {
        for (i = 0; i < participants.length; i++) {
            var participant = participants[i];

            (function (participant) {
                $.getJSON('http://hungergames-vested-mayfly.scapp.io/pollParticipantChallenges/' + participant.id, function (challenges) {
                    if (challenges.length > 0) {
                        for (j = 0; j < challenges.length; j++) {
                            var challenge = challenges[j];

                            // color code the participant based on the first challenge
                            if (j == 0) {
                                $("#" + participant.id).get(0).classList.add("challenge-" + challenge.status);
                            }

                            $("#" + participant.id + "ChallengesBlock").append(
                                "<div class=\"challenge challenge-" + challenge.status + "\">" +
                                "<span class=\"name\">" + challenge.task + "</span>" +
                                "</div>"
                            );
                        }
                    } else {
                        // color code the participant to none
                        $("#" + participant.id).get(0).classList.add("challenge-none");
                    }
                });
            })(participant);
        }
    });

    setTimeout(pollParticipants, 1000);
}

function participantClicked(participantId) {
    for (i = 0; i < $("#challenges").children().length; i++) {
        var child = $("#challenges").children()[i];

        if (child.id.indexOf(participantId) > -1) {
            if (child.classList.contains("not-selected")) {
                child.classList.toggle("selected");
                child.classList.toggle("not-selected");
            }
        } else {
            if (child.classList.contains("selected")) {
                child.classList.toggle("selected");
                child.classList.toggle("not-selected");
            }
        }
    }
}

function newChallenge(participantString) {
    var participant = JSON.parse(participantString.replace(/\$/g, "\""));

    if ($("#selectedChallenge").get(0).classList.contains("not-selected")) {
        $("#selectedChallenge").get(0).classList.toggle("selected");
        $("#selectedChallenge").get(0).classList.toggle("not-selected");
    }

    $("#selectedChallengeContent").empty();

    $("#selectedChallengeContent").append(
        "<div class=\"card-content text-center\" id=\"challenge\">" +
        "<div class=\"challenge-img\"><img src=\"" + participant.image + "\"></div>" +
        "<span id=\"runner\">Challenge " + participant.name + " to</span>" +
        "<div class=\"challenge-option\">Sprint 500m</div>" +
        "<div class=\"challenge-option\">Stand still for 20 seconds</div>" +
        "<div class=\"challenge-option\">Overtake next oponent</div>" +
        "<span style=\"font-size: 18px\"> for CHF </span>" +
        "<div class=\"subline-input-wrapper\"><input type=\"text\" class=\"subline-input\" value=\"500\"></div>" +
        "<button class=\"btn sml blue card-btn\" id=\"startChallenge\" onclick=\"startChallenge(" + participant.id + ")\">Go!</button>" +
        "</div>"
    );

    $('.challenge-option').click(function (e) {
        console.log("likes");
        $('.challenge-option').removeClass('selected');
        $(e.target).addClass('selected');
    });
}

function startChallenge(participantId) {
    var task = $(".challenge-option.selected").text();
    var incentive = $(".subline-input").val();
    var sponsor = "SWISSCOM";

    $.post({
        url: 'http://hungergames-vested-mayfly.scapp.io/newChallenge',
        data: JSON.stringify({
            participantId: participantId,
            task: task,
            incentive: incentive,
            sponsor: sponsor
        }),
        success: function (data) {
        },
        contentType: "application/json"
    });


}