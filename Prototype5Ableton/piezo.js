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

const rightPin = 'A0';
const leftPin = 'A1';
// Johnny-Five will try its hardest to detect the port for you,
// however you may also explicitly specify the port by passing
// it as an optional property to the Board constructor:
var board, rightPiezo, leftPiezo;
var leftHit = false, rightHit = false;
var piezoThreshold = 100;
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

        rightPiezo = new five.Pin(rightPin);

        // Above 50 is a good level to test first with

        // Whenever pin 13 sends value, trigger this callback function
        rightPiezo.read(function (error, value) {
            if(value > piezoThreshold && !rightHit) {
                console.log("Knock Right");
                rightHit = true;
                io.emit("right hit", true);
            }
            else if(value < piezoThreshold && rightHit) {
                rightHit = false;
            }
            
        });

        leftPiezo = new five.Pin(leftPin);

        // Above 50 is a good level to test first with

        // Whenever pin 13 sends value, trigger this callback function
        leftPiezo.read(function (error, value) {
            if (value > piezoThreshold && !leftHit) {
                console.log("Knock Left");
                leftHit = true;
                io.emit("left hit", true);
            } else if (value < piezoThreshold && leftHit) {
                leftHit = false;
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
        res.sendFile(__dirname + '/piezo.html');
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