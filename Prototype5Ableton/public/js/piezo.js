// modified from https://codepen.io/jakealbaugh/pen/qxjPMM

window.onload = function () {
    let samples = true;
    var socket = io();
    var noteCount = 0;

    // Used to map the keyPress codes for 1-8 to pad numbers
    var keyPressToMidiMap = {
        49: 36,
        50: 37,
        51: 38,
        52: 39,
        53: 40,
        54: 41,
        55: 42,
        56: 43
    }

    // Far left piezo = A0 = 1
    // Far right piezo = A3 = 4
    var piezoNotes = {
        1: false,
        2: false,
        3: false,
        4: false
    };





    $('#sounds').change(function () {
        if ($(this).is(":checked")) {
            samples = false;
        } else {
            samples = true;
        }
    });

    console.log("WELCOME");

    const synths = [
        new Tone.Synth(),
        new Tone.Synth(),
        new Tone.Synth()
    ];

    const samplers = [new Tone.Sampler({
        C4: "/audio/Happy/Woo.mp3"
    }).toMaster(), new Tone.Sampler({
        C3: "/audio/Neutral/Clap.mp3"
    }).toMaster(), new Tone.Sampler({
        "C5": "/audio/Happy/AHH.mp3"
    }).toMaster()];


    synths[0].oscillator.type = 'triangle';
    synths[1].oscillator.type = 'sine';
    synths[2].oscillator.type = 'sawtooth';

    const gain = new Tone.Gain(0.6);
    gain.toMaster();

    synths.forEach(synth => synth.connect(gain));
    // console.log(document);

    // Array of notes for the scales to play
    let scales = [
        ['Eb2', 'F2', 'Gb2', 'Ab2', 'Bb2', 'B2', 'Db3', 'Eb3'],
        // ['Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4'],
        ['Bb3', 'Bb3', 'Bb3', 'Bb3', 'Bb3', 'Bb3', 'Bb3', 'Bb3'],
        ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6']
    ];
    const $rows0 = document.body.querySelectorAll('#set0 > div > div');
    const $rows1 = document.body.querySelectorAll('#set1 > div > div');
    let index = 0;
    let counter = 0;
    let scaleIndex = 0;
    let currentEmotions = [0, 1];

    Tone.Transport.scheduleRepeat(repeat, "8n");
    Tone.Transport.bpm.value = 120;
    Tone.Transport.start();

        socket.on("right hit", function (msg) {
            console.log("GOT HIT");
            samplers[1].triggerAttack("C4");
        });

        socket.on("left hit", function (msg) {
            console.log("GOT LEFT");
            samplers[0].triggerAttack("C4");

        });


    /********* HELPER FUNCTIONS HERE  ****************/
    function switchPad(number, sequencerId) {
        console.log("switching pad", number);
        var pad = $("#" + sequencerId + "pad" + number);
        // Each input box has id of "pad" + padid number from data[1]
        var value = pad.prop("checked");
        if (value) {
            pad.prop("checked", false);
        } else {
            pad.prop("checked", true);
        }
    }

    function repeat(time) {
        // index is overall number of steps
        // counter is 8 count of steps
        // checkAndPlayCurrentNote(time);
        // visualizeIt();
        // updateSteps();
    }

    function visualizeIt() {
        // Take the current counter and add a 'blip' around the current checkbox

        // Add and remove current box for first sequencer
        // Checkboxes 0-7
        if (counter > 0) {
            $(".checkbox")
                .eq(counter - 1)
                .removeClass("current");
            $(".checkbox")
                .eq(counter)
                .addClass("current");
        } else {
            $(".checkbox")
                .eq(7)
                .removeClass("current");
            $(".checkbox")
                .eq(counter)
                .addClass("current");
        }

        // Add and remove current box for second sequencer
        // Checkboxes 8-15
        $(".checkbox")
            .eq(counter + 8)
            .addClass("current");

        if (counter == 0) {
            $(".checkbox")
                .eq(15)
                .removeClass("current");
        } else {
            $(".checkbox")
                .eq(counter + 7)
                .removeClass("current");
        }

    }

    function countActiveNotes() {
        let piezoCount = 0;
        for (var key in piezoNotes) {
            if (piezoNotes.hasOwnProperty(key)) {
                if(piezoNotes[key]) {
                    piezoCount++;
                }
            }
        }

        return piezoCount;
    }

    function updateSteps() {
        index++;
        if (counter == 7) {
            counter = 0;
        } else {
            counter++;
        }
    }

    function checkAndPlayCurrentNote(time) {
        let numNotesActive = countActiveNotes();
        console.log(numNotesActive + " Notes active");
        note = scales[scaleIndex][numNotesActive + 3];
        if (numNotesActive > 0) {
            if (samples) {
                notes = scales[scaleIndex][numNotesActive - 1];
                // console.log("Play sampler");
                // trigger a note if that input box is checked
                samplers[currentEmotions[0]].triggerAttackRelease(note, "8n", time);
            } else {
                // trigger a note if that input box is checked
                synths[2].triggerAttackRelease(note, "8n", time);
            }
        }
    }
}


