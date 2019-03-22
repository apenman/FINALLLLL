// https://socket.io/get-started/chat/
const express = require('express');
const app = express();
const path = require('path');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const midi = require('midi');
const five = require("johnny-five");

const mapVal = (num, in_min, in_max, out_min, out_max) => {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

const piezoPin1 = 'A0';
const piezoPin2 = 'A1';
const piezoPin3 = 'A2';
const piezoPin4 = 'A3';
const piezoThreshold = 200;
// Johnny-Five will try its hardest to detect the port for you,
// however you may also explicitly specify the port by passing
// it as an optional property to the Board constructor:
var board;
var piezo1, piezo2, piezo3, piezo4;
var piezo1On, piezo2On, piezo3On, piezo4On;

initApp();
// initMidiInput();
initBoard();
handleConnections();
startApp();


function initBoard() {
    // board = new five.Board({
    //     port: "/dev/cu.usbmodem14101"
    // });
    board = new five.Board();
    // The board's pins will not be accessible until
    // the board has reported that it is ready
    board.on("ready", function () {
        console.log("READY!");

        piezo1 = new five.Pin(piezoPin1);

        // Above 50 is a good level to test first with

        // Whenever pin 13 sends value, trigger this callback function
        piezo1.read(function (error, value) {
            if (value > piezoThreshold && !piezo1On) {
                console.log("Piezo 1 On");
                piezo1On = true;
                io.emit("piezo1", true);
            } else if (value < piezoThreshold && piezo1On) {
                piezo1On = false;
                io.emit("piezo1", false);
            }

        });

        piezo2 = new five.Pin(piezoPin2);

        // Above 50 is a good level to test first with

        // Whenever pin 13 sends value, trigger this callback function
        piezo2.read(function (error, value) {
            if (value > piezoThreshold && !piezo2On) {
                console.log("Piezo 2 on");
                piezo2On = true;
                io.emit("piezo2", true);
            } else if (value < piezoThreshold && piezo2On) {
                piezo2On = false;
                io.emit("piezo2", false);
            }

        });

        piezo3 = new five.Pin(piezoPin3);

        // Above 50 is a good level to test first with

        // Whenever pin 13 sends value, trigger this callback function
        piezo3.read(function (error, value) {
            if (value > piezoThreshold && !piezo3On) {
                console.log("Piezo 3 On");
                piezo3On = true;
                io.emit("piezo3", true);
            } else if (value < piezoThreshold && piezo3On) {
                piezo3On = false;
                io.emit("piezo3", false);
            }

        });

        piezo4 = new five.Pin(piezoPin4);

        // Above 50 is a good level to test first with

        // Whenever pin 13 sends value, trigger this callback function
        piezo4.read(function (error, value) {
            if (value > piezoThreshold && !piezo4On) {
                console.log("Piezo 4 On");
                piezo4On = true;
                io.emit("piezo4", true);
            } else if (value < piezoThreshold && piezo4On) {
                piezo4On = false;
                io.emit("piezo4", false);
            }

        });
    });
}


function startApp() {
    http.listen(4000, function () {
        console.log('listening on *:4000');
    });
}

function socketIO() {
    io.on('connection', function (socket) {
        console.log('a user connected');
        io.emit('midi', "hi hello");
        socket.on('disconnect', function () {
            console.log('user disconnected');
        });
    });
}

function handleConnections() {
    socketIO();
}

function initApp() {
    app.use(express.static(path.join(__dirname, 'public')));

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/piano.html');
    });
}

function initMidiInput() {
    // Open the first available input port.
    // LPD8 is connected to port #1 (as of now)
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