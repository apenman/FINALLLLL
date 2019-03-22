// modified from https://codepen.io/jakealbaugh/pen/qxjPMM
window.onload = function () {
    let samples = true;

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
        C4: "Audio/Happy/Woo.mp3"
      }).toMaster(), new Tone.Sampler({
        C3: "Audio/Neutral/Clap.mp3"
      }).toMaster(), new Tone.Sampler({
        "C5": "Audio/Happy/AHH.mp3"
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
    const $rows = document.body.querySelectorAll('div > div');
    let index = 0;
    let counter = 0;
    let scaleIndex = 0;
    let currentEmotion = 0;

    initiateMIDI();



    /********* HELPER FUNCTIONS HERE  ****************/
    function repeat(time) {
        // index is overall number of steps
        // counter is 8 count of steps
        checkAndPlayCurrentNote(time);
        visualizeIt();
        updateSteps();
    }

    function visualizeIt() {
        // Take the current counter and add a 'blip' around the current checkbox
        // console.log(counter);
        if(counter >= 0) {
            $(".checkbox")
                .eq(counter - 1)
                .removeClass("current");
            $(".checkbox")
              .eq(counter)
              .addClass("current");
        }
        else {
            $(".checkbox")
                .eq(6)
                .removeClass("current");
            $(".checkbox")
              .eq(7)
              .addClass("current");
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
            note = scales[scaleIndex][counter],
            $row = $rows[0];
        // if our 8 count is above halfway, it's in the second row of checkboxes
        if (counter > 3) {
            // console.log("Row 2 at counter " + counter + " and index " + index);
            $row = $rows[1]
        }

        // access the input field by the number in its row
        let $label = $row.querySelector(`label:nth-child(${step + 1})`);
        let $input = $label.querySelector(`input`);

        if(samples) {
            notes = scales[scaleIndex][counter];
            console.log("Play sampler");
            // trigger a note if that input box is checked
            if ($input.checked) samplers[currentEmotion].triggerAttackRelease(note, "8n", time);
        }
        else {
            // trigger a note if that input box is checked
            if ($input.checked) synths[0].triggerAttackRelease(note, "8n", time);
        }
    }

    const mapVal = (num, in_min, in_max, out_min, out_max) => {
        return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }

    function processMIDI(data) {
        console.log(data);
        // if it's a pad
        if(data[0] == 144) {
            var pad = $("#pad" + data[1]);
            // Each input box has id of "pad" + padid number from data[1]
            var value = pad.prop("checked");
            if(value) {
                pad.prop("checked", false);
            }
            else {
                pad.prop("checked", true);
            }
        }
        // if it's knob 1
        else if(data[1] == 1) {
            let newEmotion = Math.round(mapVal(data[2], 0, 127, 0, 2));
            scaleIndex = newEmotion;
            if(newEmotion != currentEmotion) {
                $('.emoji' + currentEmotion).removeClass("emotion");
                $('.emoji' + newEmotion).addClass("emotion");
            }
            currentEmotion = newEmotion;
        }
        // if it's knob 5, update tempo
        else if(data[1] == 5) {
            // console.log("KNOB UPDATE");
        }
    }

    function initiateMIDI() {
        if (navigator.requestMIDIAccess) {
            console.log("This browser supports WebMIDI!");
        } else {
            console.log("WebMIDI is not supported in this browser.");
        }

        navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

        function onMIDISuccess(midiAccess) {
            console.log("GOT MIDI ACCESS");
            for (var input of midiAccess.inputs.values()) {
                input.onmidimessage = getMIDIMessage;
            }

            // Once we get the MIDI, start tone
            Tone.Transport.scheduleRepeat(repeat, "8n");
            Tone.Transport.bpm.value = 120;

            Tone.Transport.start();
        }

        function getMIDIMessage(midiMessage) {
            // console.log(midiMessage.data);
            processMIDI(midiMessage.data);
        }

        function onMIDIFailure() {
            console.log("Could not access your MIDI devices.");
        }
    }


}

