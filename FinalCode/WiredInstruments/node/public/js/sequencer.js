// modified from https://codepen.io/jakealbaugh/pen/qxjPMM

window.onload = function () {
    let samples = true;
    var socket = io();

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

    // keyPress codes for 1-8 are 49-56
    // Midi values for 1-8 are 36-43
    $(document).keypress(function (e) {
        console.log(e.which);
        if(e.which == 113) {
            console.log("Emotio switch");
            switchEmotion(0, 1);
        }
        else if (e.which == 119) {
            switchEmotion(1, 1);
        }
        else if(e.which == 101) {
            switchEmotion(2, 1);
        }
        else {
            switchPad(keyPressToMidiMap[e.which], 1);
        }
    });

    socket.on('midi', function (msg) {
        // $('#messages').append($('<li>').text(msg));
        console.log("MIDI message received ", msg);
    });

    socket.on('pad', function (msg) {
        // $('#messages').append($('<li>').text(msg));
        switchPad(msg, 0);
    });

    socket.on('emotion', function (msg) {
        // $('#messages').append($('<li>').text(msg));
        switchEmotion(msg, 0);
    });

    socket.on('arduino', function(msg) {
        console.log("switching style");
        var sounds = $("#sounds");
        // Each input box has id of "sounds" + soundsid number from data[1]
        var value = sounds.prop("checked");
        if (value) {
            sounds.prop("checked", false);
            samples = false;

        } else {
            sounds.prop("checked", true);
            samples = true;

        }
    });

            socket.on("right hit", function (msg) {
                console.log("GOT HIT");
                samplers[1].triggerAttack("C4");
            });

            socket.on("left hit", function (msg) {
                console.log("GOT LEFT");
                samplers[0].triggerAttack("C4");

            });

    $('#sounds').change(function () {
        if ($(this).is(":checked")) {
            samples = false;
        }
        else {
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
    let currentEmotions = [0, 0];

    Tone.Transport.scheduleRepeat(repeat, "8n");
    Tone.Transport.bpm.value = 120;
    Tone.Transport.start();



    /********* HELPER FUNCTIONS HERE  ****************/
    function switchEmotion(newEmotion, sequencerId) {
        if (newEmotion != currentEmotions[sequencerId]) {
            $('.' + sequencerId + 'emoji' + currentEmotions[sequencerId]).removeClass("emotion");
            $('.' + sequencerId + 'emoji' + newEmotion).addClass("emotion");
        }
        currentEmotions[sequencerId] = newEmotion;
    }

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
        checkAndPlayCurrentNote(time);
        visualizeIt();
        updateSteps();
    }

    function visualizeIt() {
        // Take the current counter and add a 'blip' around the current checkbox

        // Add and remove current box for first sequencer
        // Checkboxes 0-7
        if(counter > 0) {
            $(".checkbox")
                .eq(counter - 1)
                .removeClass("current");
            $(".checkbox")
              .eq(counter)
              .addClass("current");
        }
        else {
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

        if(counter == 0) {
            $(".checkbox")
                .eq(15)
                .removeClass("current");
        }
        else {
            $(".checkbox")
                .eq(counter + 7)
                .removeClass("current");
        }

    }

    function updateSteps() {
        index++;
        if (counter == 7) {
            counter = 0;
        }
        else {
            counter++;
        }
    }

    function checkAndPlayCurrentNote(time) {
        // step is used to access the current step in a row (out of four)
        let step = index % 4,
            note0 = scales[currentEmotions[0]][counter],
            note1 = scales[currentEmotions[1]][counter],
            $row0 = $rows0[0],
            $row1 = $rows1[0];

        
        // if our 8 count is above halfway, it's in the second row of checkboxes
        if (counter > 3) {
            // console.log("Row 2 at counter " + counter + " and index " + index);
            $row0 = $rows0[1];
            $row1 = $rows1[1];
        }

        // access the input field by the number in its row
        let $label0 = $row0.querySelector(`label:nth-child(${step + 1})`);
        let $input0 = $label0.querySelector(`input`);
        let $label1 = $row1.querySelector(`label:nth-child(${step + 1})`);
        let $input1 = $label1.querySelector(`input`);

        if(samples) {
            note0 = scales[currentEmotions[0]][counter];
            note1 = scales[currentEmotions[1]][counter];

            // console.log("Play sampler");
            // trigger a note if that input box is checked
            if ($input0.checked) samplers[currentEmotions[0]].triggerAttackRelease(note0, "8n", time);
            if ($input1.checked) samplers[currentEmotions[1]].triggerAttackRelease(note1, "8n", time);
        }
        else {
            // trigger a note if that input box is checked
            if ($input0.checked) synths[0].triggerAttackRelease(note0, "8n", time);
            if ($input1.checked) synths[0].triggerAttackRelease(note1, "8n", time);
        }
    }
}

