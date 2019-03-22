#include <Wire.h>
#include <WiFiNINA.h>
#include <WiFiUdp.h>
#include <OSCMessage.h>
#include <OSCBundle.h>
#include <ButtonDebounce.h>

///////////////
// OSC STUFF //
///////////////

int status = WL_IDLE_STATUS;
#include "arduino_secrets.h"
///////please enter your sensitive data in the Secret tab/arduino_secrets.h
char ssid[] = SECRET_SSID;        // your network SSID (name)
char pass[] = SECRET_PASS;    // your network password (use for WPA, or use as key for WEP)
int keyIndex = 0;            // your network key Index number (needed only for WEP)

WiFiUDP Udp;

const IPAddress outIp(192, 168, 1, 131);     // remote IP of your computer
//const IPAddress outIp(10, 244, 254, 25);     // remote IP of your computer
unsigned int localPort = 2390;      // local port to listen on
const unsigned int outPort = 8001;          // remote port to receive OSC

///////////////
/// BUTTONS ///
///////////////
ButtonDebounce button1(0, 500);
ButtonDebounce button2(1, 500);
ButtonDebounce button3(2, 500);
ButtonDebounce button4(3, 500);
ButtonDebounce button5(4, 500);
ButtonDebounce button6(5, 500);
ButtonDebounce button7(6, 500);


int button1State = LOW;
int button2State = LOW;
int button3State = LOW;
int button4State = LOW;
int button5State = LOW;
int button6State = LOW;
int button7State = LOW;

ButtonDebounce buttonArr[] = { button1, button2, button3, button4, button5, button6, button7};
int buttonStates[] = { button1State, button2State, button3State, button4State, button5State, button6State, button7State };



///////////////
///// POTS /////
///////////////

const int octavePin = 1;
int lastOctaveVal = 0;

// Update this to increase or reduce the amount of times to do a check
// Depends on which intervals are for the physical dial
const int octaveCheckInterval = 100;

void setup() 
{
  Serial.begin(115200);
  
  connectWiFi();
  // if you get a connection, report back via serial:
  Udp.begin(localPort);
}

void loop() 
{
  //Serial.println("Looping");
  readOctave();
  checkButtonStatus();
}

// Message = [intrument, inputNumber, inputVal]
// inputNumber = 0-indexed integers matching to each input on instrument
void createBassMessage(int inputNumber, int inputVal) {
  OSCMessage msg("/melody");

  // Add message channel
  char channelBuffer[12];
  msg.add(itoa(inputNumber, channelBuffer, 10));

  // Add message value
  char valueBuffer[12];
  msg.add(itoa(inputVal, valueBuffer, 10));

  sendOSCMessage(msg);
}

void sendOSCMessage(OSCMessage& msg) {
   Udp.beginPacket(outIp, outPort);
   msg.send(Udp);
   Udp.endPacket(); // mark the end of the OSC Packet
   msg.empty();
}

void checkButtonStatus() {
  Serial.println("CHECKING");
  // For all 8 buttons, take a check
  for(int i = 0; i < 8; i++) {
    ButtonDebounce button = buttonArr[i];
    button.update();
    int buttonState = buttonStates[i];
    if(i == 0) {
              Serial.println("Button is " + String(buttonState));

    }
    if(button.state() != buttonState){
      if(button.state() == HIGH) {
        // send on signal over OSC
        createBassMessage(i, 1);
        Serial.println("Button " + String(i) + " On");
      }
      else {
        // send off signal over OSC
        createBassMessage(i, 0);
        Serial.println("Button " + String(i) + " Off");
      }
      buttonStates[i] = button.state();
    }
  }
}

void readOctave() {
  int val = analogRead(octavePin);    // read the value from the sensor
  if(val > lastOctaveVal + octaveCheckInterval || val < lastOctaveVal - octaveCheckInterval) {
    Serial.println("Pot is " + String(val));
    
    // If slider is at 0, send lowest octave
    if(val < 340) {
      createBassMessage(9, 0);
    }
    // If slider is in the middle, send base octave
    else if(val < 680) {
      createBassMessage(9, 1);
    }
    // If slider is up, send highest octave
    else {
      createBassMessage(9, 2);
    }

    lastOctaveVal = val;
  }
}

void connectWiFi() {
  // check for the WiFi module:
  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("Communication with WiFi module failed!");
    // don't continue
    while (true);
  }

  String fv = WiFi.firmwareVersion();
  if (fv < "1.0.0") {
    Serial.println("Please upgrade the firmware");
  }

  // attempt to connect to Wifi network:
  while (status != WL_CONNECTED) {
    Serial.print("Attempting to connect to SSID: ");
    Serial.println(ssid);
    // Connect to WPA/WPA2 network. Change this line if using open or WEP network:
    status = WiFi.begin(ssid, pass);

    // wait 10 seconds for connection:
    delay(10000);
  }
  
  Serial.println("Connected to wifi");
  printWifiStatus();

  Serial.println("\nStarting connection to server...");
}

void printWifiStatus() {
  // print the SSID of the network you're attached to:
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  // print your WiFi shield's IP address:
  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);

  // print the received signal strength:
  long rssi = WiFi.RSSI();
  Serial.print("signal strength (RSSI):");
  Serial.print(rssi);
  Serial.println(" dBm");
}
