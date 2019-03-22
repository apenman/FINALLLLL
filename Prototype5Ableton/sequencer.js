// https://socket.io/get-started/chat/
const express = require('express');
const app = express();
const path = require('path');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const midi = require('midi');
var osc = require('node-osc');

const mapVal = (num, in_min, in_max, out_min, out_max) => {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}


// Set up a new input.
var input = new midi.input();
var virtualBus1Output = new midi.output();
var virtualBus2Output = new midi.output();

//OSC
var oscServer;

initApp();
startOSCServer();
connectToIACBus1();
connectToIACBus2();
initMidiInput();
startApp();

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
    oscServer = new osc.Server(8081, '127.0.0.1');
    oscServer.on("message", function (msg, rinfo) {
        console.log("TUIO message:");
        console.log(msg);
    });
}

function haha() {
    // 144 = note on
    // 60 = middle C
    // 100 = velocity
    virtualBus1Output.sendMessage([144, 60, 100]);
}

function haha2() {
    virtualBus2Output.sendMessage([144, 80, 100]);
}

function connectToIACBus1() {
    // Open the first available input port.
    // LPD8 is connected to port #1 (as of now)
    console.log("MIDI PORTS");
    console.log(input.getPortName(0));
    // console.log(input.getPortName(1));
    // console.log("HI");
    virtualBus1Output.openPort(0);

    setInterval(haha, 1000);

}

function connectToIACBus2() {
    // Open the first available input port.
    // LPD8 is connected to port #2 (as of now)
    console.log("MIDI PORTS");
    console.log(input.getPortName(1));
    virtualBus2Output.openPort(1);

    setInterval(haha2, 1500);
}

function initMidiInput() {
    // Open the first available input port.
    // LPD8 is connected to port #1 (as of now)
    console.log("MIDI PORTS");
    console.log(input.getPortName(0));
    // console.log(input.getPortName(1));
    // console.log("HI");
    if (input.getPortCount() > 1 && input.getPortName(1)) {
        input.openPort(1);
    }

    // Configure a callback.
    input.on('message', function (deltaTime, message) {
        // The message is an array of numbers corresponding to the MIDI bytes:
        //   [status, data1, data2]
        // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
        // information interpreting the messages.

        // if it's a pad
        if (message[0] == 144) {
            io.emit('pad', message[1]);
        }
        // if it's knob 1
        else if (message[1] == 1) {
            let newEmotion = Math.round(mapVal(message[2], 0, 127, 0, 2));
            io.emit('emotion', newEmotion);
        }
        // if it's knob 5, update tempo
        else if (message[1] == 5) {
            // console.log("KNOB UPDATE");
            io.emit('tempo', message[2]);
        }

        console.log('m:' + message + ' d:' + deltaTime);
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