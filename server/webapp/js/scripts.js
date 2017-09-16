var participantColors = [];
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

            (function (participant, i) {
                $.getJSON('http://hungergames-vested-mayfly.scapp.io/pollParticipantChallenges/' + participant.id, function (challenges) {
                    if (challenges.length > 0) {
                        for (j = 0; j < challenges.length; j++) {
                            var challenge = challenges[j];

                            // color code the participant based on the first challenge
                            if (j == 0) {
                                $("#" + participant.id).get(0).classList.add("challenge-" + challenge.status);
                                if (challenge.status === 'INIT') {
                                  participantColors[i] = '#ffa500';
                                } else {
                                  participantColors[i] = '#00ff00';
                                }
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
                        participantColors[i] = '#ff0000';
                    }
                });
            })(participant, i);
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

var map = L.map("map").setView([46.43266, 9.768719], 15);
var mapElements = [];
L.esri.basemapLayer("Imagery").addTo(map);

var trackpoints = [];
var latlngs = [];
var pointList = [];
var offset = 0;
var seconds = 0;

function incrementSeconds() {
    for (el of mapElements) {
        map.removeLayer(el);
    }
    mapElements = [];

    function drawOne(time, color) {
        var diffLat = latlngs[time + 1]["lat"] - latlngs[time]["lat"];
        var diffLng = latlngs[time + 1]["lon"] - latlngs[time]["lon"];

        var center = [latlngs[time]["lat"] + diffLat / 2, latlngs[time]["lon"] + diffLng / 2];
        var angle = 360 - (Math.atan2(diffLat, diffLng) * 57.295779513082);

        var arrowM = new L.marker(center, {
            icon: new L.divIcon({
                className: "arrowIcon",
                iconSize: new L.Point(30, 30),
                iconAnchor: new L.Point(15, 15),
                html: "<div style = 'font-size: 20px; -webkit-transform: rotate(" + angle + "deg); color:" + color + "'>&#10151;</div>"
            })
        }).addTo(map);

        mapElements.push(arrowM);
    }
    drawOne(seconds, participantColors[0]);// '#0074D9');
    if (seconds > 20) {
        drawOne(seconds - 19, participantColors[1]);//  '#2ECC40');
    }
    if (seconds > 30) {
        drawOne(seconds - 28, participantColors[2]);//  '#FF4136');
    }
    if (seconds > 45) {
        drawOne(seconds - 41, participantColors[3]);//  '#B10DC9');
    }
    if (seconds > 75) {
        drawOne(seconds - 74, participantColors[4]);//  '#FFDC00');
    }
    if (seconds > 84) {
        drawOne(seconds - 83, participantColors[5]);//  '#DCFF00');
    }


    if (seconds % 50 == 0) {
        var diffLat = latlngs[seconds + 1]["lat"] - latlngs[seconds]["lat"];
        var diffLng = latlngs[seconds + 1]["lon"] - latlngs[seconds]["lon"];

        var center = [latlngs[seconds]["lat"] + diffLat / 2, latlngs[seconds]["lon"] + diffLng / 2];
        map.panTo(center);
    }

    seconds++;
    if (seconds > latlngs.length) {
        seconds = 0;
    }
    setTimeout(incrementSeconds, 250);
}

function getResults(offset) {
    console.log(offset);

    var query = new L.esri.query({
        url: 'https://services1.arcgis.com/i9MtZ1vtgD3gTnyL/arcgis/rest/services/Refnr144269/FeatureServer/0'
    });
    query.where('1=1').orderBy('time').offset(offset).limit(500).run(function (error, results) {
        if (!error && results.features.length > 0) {
            for (el of results.features) {
                var mapEl = L.geoJson(el);
                trackpoints.push(mapEl);
                latlngs.push({
                    'lat': el['properties']['lat'],
                    'lon': el['properties']['lon']
                });
                pointList.push(new L.LatLng(el['properties']['lat'], el['properties']['lon']));
            }
            getResults(offset + 500);
        } else {
            console.log(error);
            setTimeout(incrementSeconds, 50);
            var track = new L.Polyline(pointList, {
                color: 'red',
                weight: 3,
                opacity: 0.5,
                smoothFactor: 1
            });
            track.addTo(map);
        }
    });
}
getResults(0);