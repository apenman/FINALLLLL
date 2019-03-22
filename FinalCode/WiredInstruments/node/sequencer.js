// https://socket.io/get-started/chat/
const express = require('express');
const app = express();
const path = require('path');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const midi = require('midi');
const osc = require('node-osc');
const StepSequencer = require('step-sequencer');

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const port = new SerialPort('/dev/cu.usbmodem14201');
const parser = port.pipe(new Readline({
    delimiter: '\r\n'
}))
parser.on('data', handleRhythmSerial);
// parser.on('data', handleBassSerial);
// parser.on('data', handleMelodySerial);

// const port2 = new SerialPort('/dev/cu.usbmodem142301');
// const parser2 = port2.pipe(new Readline({
//     delimiter: '\r\n'
// }))
// parser2.on('data', console.log);

// const port3 = new SerialPort('/dev/cu.usbmodem142401');
// const parser3 = port3.pipe(new Readline({
//     delimiter: '\r\n'
// }))
// parser3.on('data', console.log);

const mapVal = (num, in_min, in_max, out_min, out_max) => {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

var melodyStates = {
    // 0-6 map to buttons
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    // 7 is octave slider
    7: 1,
    // 8 and 9 are effect knobs
    8: 0,
    9: 0
};

var melodyNotes = {
    0: 60,
    1: 64,
    2: 67,
    3: 65,
    4: 60,
    5: 64,
    6: 67,
}

var bassNotes = {
    0: 60,
    1: 64, 
    2: 67,
    // SWING STYLE NOTE
    3: 0,
}

var bassStates = {
    // Play / Pause (turn on/off notes with MIDI Signal)
    0: 0,
    // Single vs 3 notes 
    1: 0,
    // Swing style
    2: 0,
    // Regular vs random
    3: 0,
    // Turbo (middle button)
    4: 0
    // Don't need states for filters/octaves, just adjust on press/release
}

var rhythmStates = {
    // Left instrument
    0:0,
    // Right instrument
    1:0,
    // left drum (inputNumber 2)
    2:0,
    // right drum (inputNumber 3)
    3:0
}

var baseNote = 60;

// For keeping timing
// https://www.npmjs.com/package/step-sequencer

// Set up a new input.
var input = new midi.input();
var virtualBus1Output = new midi.output();
var virtualBus2Output = new midi.output();
var virtualBus3Output = new midi.output();
//OSC
var oscServer;

initApp();
// startOSCServer();
connectToIACBus1();
connectToIACBus2();
connectToIACBus3();
// initMidiInput();
startApp();
// initSequencer();

function startApp() {
    http.listen(4000, function () {
        console.log('listening on *:4000');
    });
}

function initApp() {
    app.use(express.static(path.join(__dirname, 'public')));

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/sequencer.html');
    });
}

function startOSCServer() {
    oscServer = new osc.Server(8001, '192.168.120.163');
    oscServer.on("message", function (msg, rinfo) {
        // console.log(msg);
        // msg[0] is the addr   ess
        if(msg[0] == '/buzzo') {
            // console.log("BASS MESSAGE: ", msg);
            handleBassOSC(msg);
        }
        else if(msg[0] == '/pio') {
            // console.log("MELODY MESSAGE: ", msg);
            handleMelodyOSC(msg);
        }
        else if(msg[0] == '/rhythmo') {
            // console.log("RHYTHM MESSAGE: ", msg);
            handleRhythmOSC(msg);
        }
    });
}

// Goes through IAC Bus 3
// msg = [instrument, inputNumber, inputVal]
function handleBassSerial(data) {
    var res = data.split("/");
    console.log(res);
    handleBassOSC(res);
}

// Goes through IAC Bus 3
// msg = [instrument, inputNumber, inputVal]
function handleRhythmSerial(data) {
    var res = data.split("/");
    console.log(res);
    handleRhythmOSC(res);
}

// Goes through IAC Bus 3
// msg = [instrument, inputNumber, inputVal]
function handleMelodySerial(data) {
    var res = data.split("/");
    console.log(res);
    handleMelodyOSC(res);
}

// Goes through IAC Bus 3
// msg = [instrument, inputNumber, inputVal]
function handleBassOSC(msg) {
    var input = msg[1];
    var val = msg[2]
    if(input == '1' || input == '0') {
        // Inversion because I hooked them up weird, change this later
        if(val == 0) {
            bassStates[input] = 1;
        }
        else {
            bassStates[input] = 0;
        }
    }
    else {
        bassStates[input] = val;
    }
    
    console.log("MESSAGE", msg);
    switch (parseInt(input)) {
        case 0:
            bassPlayPause(input);
            break;
        case 1:
            bassArp(input);
            break;
        case 2:
            bassSwing(input);
            break;
        case 3:
            bassRandom(input);
            break;
        case 4:
            bassTurbo(input);
            break;
        case 5:
            // Turn filter "down"
            bassFilterDown(bassStates[input]);
            break;
        case 6:
            // Turn filter "up"
            bassFilterUp(bassStates[input]);
            break;
        case 7:
            // Shift octave down
            if (bassStates[val] == 1) {
                console.log("BASS DOWN");
                bassOctave(0);
            }
            // Reset octave up
            else {
                console.log("BASS UP");
                bassOctave(1);
            }
            break;
        case 8:
            // Shift octave up
            if (bassStates[val] == 1) {
                bassOctave(1);
            }
            // Reset octave down
            else {
                bassOctave(0);
            }
            break;
        default:
            break;
    }
    // console.log("UPDATED BASS", bassStates);
            console.log("STATES", bassStates);

}

function bassPlayPause(val) {
    console.log(" PLAY PAUS ");
    for(var i = 0; i < 3; i++) {
        // Turn everything off
        if (bassStates[val] == 0) {
            virtualBus2Output.sendMessage([128, bassNotes[i], 127]);
        }
        // Turn everything on
        else {
            if(i == 0) {
                virtualBus2Output.sendMessage([144, bassNotes[i], 100]);
            }
            // Only turn on other notes if it is set to arp mode
            else if(bassStates[1] == 1) {
                virtualBus2Output.sendMessage([144, bassNotes[i], 100]);
            }
        }
    }    
}

function bassArp(val) {
    console.log("Arp ");
    // bug when arp switches on, octave only goes down and gets weird, turbo pressed on once
    // Only turn on notes if play is active
    if(bassStates[0] == 1) {
        // Turn to single note, turn off other notes
        if (bassStates[val] == 0) {
            virtualBus2Output.sendMessage([128, bassNotes[1], 127]);
            virtualBus2Output.sendMessage([128, bassNotes[2], 127]);
        }
        // Turn to three notes
        else {
            virtualBus2Output.sendMessage([144, bassNotes[1], 100]);
            virtualBus2Output.sendMessage([144, bassNotes[2], 100]);
        }
    }
    // Otherwise do nothing, it's paused
    else {

    }

}

function bassSwing(val) {
    // If turbo is not pressed
    console.log("meep");
    if(bassStates[4] == 0) { 
        // Turn to swing 16
        if (bassStates[val] == 1) {
            console.log("SWING 16");
            virtualBus2Output.sendMessage([144, bassNotes[3], 100]);
        }
        // Turn to swing 8
        else {
            console.log("SWING 8");
            // Press three times to go from swing 16 and cycle back to swing 8
            virtualBus2Output.sendMessage([144, bassNotes[3], 100]);
            virtualBus2Output.sendMessage([144, bassNotes[3], 100]);
            virtualBus2Output.sendMessage([144, bassNotes[3], 100]);
        }
    }
}

function bassRandom(val) {
    console.log("random");
    // Turn off random (MIDI Val)
    if (bassStates[val] == 0) {
        virtualBus2Output.sendMessage([176, 0, 0]);
    }
    // Turn on random (MIDI Val)
    else {
        virtualBus2Output.sendMessage([176, 0, 127]);
    }
}

function bassTurbo(val) {
    console.log("TURBO", bassStates[val]);
    // Turn off turbo and set to current bass style val (MIDI Val)
    if (bassStates[val] == 0) {
        // Turn back to swing 16
        if(bassStates[2] == 1) {
            virtualBus2Output.sendMessage([144, bassNotes[3], 100]);
            virtualBus2Output.sendMessage([144, bassNotes[3], 100]);
            virtualBus2Output.sendMessage([144, bassNotes[3], 100]);
        }
        else {
            virtualBus2Output.sendMessage([144, bassNotes[3], 100]);
            virtualBus2Output.sendMessage([144, bassNotes[3], 100]);
        }
    }
    // Turn on turbo (MIDI Val)
    else {
        // Turn from swing 16
        if (bassStates[2] == 1) {
            virtualBus2Output.sendMessage([144, bassNotes[3], 100]);
        } else {
            virtualBus2Output.sendMessage([144, bassNotes[3], 100]);
            virtualBus2Output.sendMessage([144, bassNotes[3], 100]);
        }
    }
}

function bassFilterDown(on) {
    if(on == 1) {
        virtualBus2Output.sendMessage([176, 1, 30]);
    }
    else {
        virtualBus2Output.sendMessage([176, 1, 70]);
    }
}

function bassFilterUp(on) {
    console.log("filter");
    // Turn down filter
    if (on == 1) {
        virtualBus2Output.sendMessage([176, 1, 110]);
    }
    // Turn up filter
    else {
        virtualBus2Output.sendMessage([176, 1, 70]);
    }
}

function bassOctave(direction) {
    console.log("Octave");
    for(var i = 0; i < 3; i++) {
        // turn off all notes first
        virtualBus2Output.sendMessage([128, bassNotes[i], 127]);

        if (direction == 0) {
            bassNotes[i] = bassNotes[i] - 12;
        }
        else {
            bassNotes[i] = bassNotes[i] + 12;
        }

        // turn back on
        if (i == 0) {
            virtualBus2Output.sendMessage([144, bassNotes[i], 100]);
        }
        // Only turn on other notes if it is set to arp mode
        else if (bassStates[1] == 1) {
            virtualBus2Output.sendMessage([144, bassNotes[i], 100]);
        }
    }
}

// Goes through IAC Bus 2
// msg = [instrument, inputNumber, inputVal]
// inputNumber - 0 indexed)
//  Updates the melody state object with new messges
function handleMelodyOSC(msg) {
    console.log("UPDATED MELODY", msg);
    // It's a note
    if(msg[1] <= 6) {
        // turn on note
        melodyStates[msg[1]] = msg[2];
        if(msg[2] == 1) {
            console.log("TURN ON " + melodyNotes[msg[1]]);
            virtualBus1Output.sendMessage([144, melodyNotes[msg[1]], 100]);
        }
        // turn off note
        else {
            console.log("TURN OFF " + msg[1]);
            virtualBus1Output.sendMessage([128, melodyNotes[msg[1]], 127]);
        }
    }
    // It's the octave slider
    else if(msg[1] == 8) {
        var val = msg[2];
        // Low octave
        if(val < 340) {
            if(melodyStates[7] != 0) {
                console.log("SWITCH MELODY LOW");
                melodyStates[7] = 0;
                updateMelodyNotes(0);
            }
        }
        // Mid octave
        else if(val < 680) {
            // If it's currently low, shift everything up
            if (melodyStates[7] == 0) {
                console.log("SWITCH MELODY MID");
                updateMelodyNotes(1);
            }
            // If it's currently high, shift everything down
            else if (melodyStates[7] == 2) {
                console.log("SWITCH MELODY MID");
                updateMelodyNotes(0);
            }
            
            melodyStates[7] = 1;
        }
        // High octave
        else {
            if (melodyStates[7] != 2) {
                console.log("SWITCH MELODY HIGH");
                melodyStates[7] = 2;
                updateMelodyNotes(1);
            }
        }
    }
}

function updateMelodyNotes(direction) {
    for(var i = 0; i < 7; i++) {
        // Turn off notes before shift
        // If note is on
        if(melodyStates[i] == 1) {
            // Send temporary off MIDI Signla
            virtualBus1Output.sendMessage([128, melodyNotes[i], 127]);
        }

        // Shift notes
        // Shift scale down
        if(direction == 0) {
            melodyNotes[i] = melodyNotes[i] - 12;
        }
        // Shift scale up
        else {
            melodyNotes[i] = melodyNotes[i] + 12;
        }

        // Turn on old notes after shift
        if (melodyStates[i] == 1) {
            // Turn note back on
            virtualBus1Output.sendMessage([144, melodyNotes[i], 100]);
        }
    }
}

// Goes through IAC Bus 1
// msg = [instrument, inputNumber, inputVal]
// inputNumber = 0 or 1, update effect states
// inputNumber = 2 or 3, fire right away
function handleRhythmOSC(msg) {
    var inputNumber = msg[1];
    // if input comes from knob, assign sounds
    if(inputNumber == 0 || inputNumber == 1) {
        var value = msg[2];
        if(value < 255) {
            rhythmStates[inputNumber] = 0;
        }
        else if(value < (255*2)) {
            rhythmStates[inputNumber] = 1;
        }
        else if(value < (255*3)) {
            rhythmStates[inputNumber] = 2;
        }
        else {
            rhythmStates[inputNumber] = 3;
        }
        console.log(rhythmStates);
        // rhythmStates[inputNumber] = msg[2];
        // var mappedVal = mapVal(msg[2], 50, 1023, 0, 127);
        // var floored = Math.floor(Math.round(mappedVal), 0);
        // console.log("GOT MAPPED VAL " + floored);
        // virtualBus1Output.sendMessage([176, 0, floored]);
    }
    // else drum hit, fire midi message right away
    else if(msg[2] == 1) {
        console.log("BAP");
        // TODO: Adjust velocity of note based on velocity of hit (VERY low priority)
        virtualBus3Output.sendMessage([144, baseNote + rhythmStates[inputNumber-2], 100]);
    }
}

function haha() {
    // 144 = note on
    // 60 = C3
    // 100 = velocity
    virtualBus1Output.sendMessage([128, 60, 127]);
}

function haha2() {
    // 61 = C#3
    virtualBus2Output.sendMessage([144, 61, 100]);
}

function connectToIACBus1() {
    // Open the first available input port.
    // LPD8 is connected to port #1 (as of now)
    console.log("MIDI PORTS");
    console.log(input.getPortName(0));
    // console.log(input.getPortName(1));
    // console.log("HI")
    virtualBus1Output.openPort(0);

    haha();
    
}

function connectToIACBus2() {
    // Open the first available input port.
    // LPD8 is connected to port #2 (as of now)
    console.log("MIDI PORTS");
    console.log(input.getPortName(1));
    virtualBus2Output.openPort(1);
    // setInterval(haha2, 1500);
}

function connectToIACBus3() {
    // Open the first available input port.
    // LPD8 is connected to port #2 (as of now)
    console.log("MIDI PORTS");
    console.log(input.getPortName(2));
    virtualBus3Output.openPort(2);
    // setInterval(haha2, 1500);
}

function initMidiInput() {
    // Open the first available input port.
    // LPD8 is connected to port #1 (as of now)
    console.log("MIDI PORTS");
    console.log(input.getPortName(0));
    // console.log(input.getPortName(1));
    // console.log("HI");
    if (input.getPortCount() > 1 && input.getPortName(1)) {
        input.openPort(2);
    }

    // Configure a callback.
    input.on('message', function (deltaTime, message) {
        // The message is an array of numbers correspo`nding to the MIDI bytes:
        //   [status, data1, data2]
        // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
        // information interpreting the messages.
            console.log("Back");
console.log(message);
        // if it's a pad
        if (message[0] == 144) {
            console.log(message);
            io.emit('pad', message[1]);
        }
        // if it's knob 1
        else if (message[1] == 1) {
                        console.log("WOO");

            let newEmotion = Math.round(mapVal(message[2], 0, 127, 0, 2));
            io.emit('emotion', newEmotion);
        }
        // if it's knob 5, update tempo
        else if (message[1] == 5) {
            // console.log("KNOB UPDATE");
                        console.log("WOO");

            io.emit('tempo', message[2]);
        }

        // console.log('m:' + message + ' d:' + deltaTime);
    });

    // Sysex, timing, and active sensing messages are ignored
    // by default. To enable these message types, pass false for
    // the appropriate type in the function below.
    // Order: (Sysex, Timing, Active Sensing)
    // For example if you want to receive only MIDI Clock beats
    // you should use
    // input.ignoreTypes(true, false, true)
    input.ignoreTypes(false, false, false);

    // ... receive MIDI messages ...

    // Close the port when done.
    // input.closePort();
}

function playMelody() {
    virtualBus1Output.sendMessage([144, 60, 100]);
}

function playBass() {
    virtualBus2Output.sendMessage([144, 40, 100]);
}

// Play the notes that are active
function playNotes(step) {
    // console.log(count++);
    // playBass();
    // playMelody();
}

var count = 0;
function initSequencer() {
    stepSequencer = new StepSequencer(tempo, division, sequence);
    // The StepSequencer emits the number of
    // the step when that step is to be played
    stepSequencer.on('0', playNotes);
    stepSequencer.play();
}