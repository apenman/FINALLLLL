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

//const IPAddress outIp(192, 168, 1, 131);     // remote IP of your computer
const IPAddress outIp(192, 168, 120, 163);

//const IPAddress outIp(10, 244, 254, 25);     // remote IP of your computer
unsigned int localPort = 2390;      // local port to listen on
const unsigned int outPort = 8001;          // remote port to receive OSC


///////////////
///// POT /////
///////////////
const int leftPin = 0;
int leftVal = 0;
int lastLeftVal = 0;
const int rightPin = 1;
int rightVal = 0;
int lastRightVal = 0;
// Update this to increase or reduce the amount of times to do a check
// Depends on which intervals are for the physical dial
const int potCheckInterval = 25;
int val = 0;
int val2 = 0;
bool buh = false;
bool buh2 = false;
int leftPadPin = 2;
int rightPadPin = 3;

///////////////
///// PAD /////
///////////////
ButtonDebounce leftPad(0, 500);
ButtonDebounce rightPad(0, 500);
int buttonState = LOW;
bool leftTriggered = false;
bool rightTriggered = false;

ButtonDebounce padArr[] = {leftPad, rightPad};
int padStates[] = {leftTriggered, rightTriggered};

void setup()
{
  Serial.begin(115200);
  Serial.println("STARTING...");
//  connectWiFi();
  // if you get a connection, report back via serial:
//  Udp.begin(localPort);
}

void loop()
{
  //Serial.println("Looping");
  readPot();
  checkPads();
  //  checkButtonStatus();
}

void createRhythmoMessage(int channelNumber, int inputVal) {
//  OSCMessage msg("/rhythmo");
//
//  // Add message channel
//  char channelBuffer[12];
//  msg.add(itoa(channelNumber, channelBuffer, 10));
//
//  // Add message value
//  char valueBuffer[12];
//  msg.add(itoa(inputVal, valueBuffer, 10));
//
//  sendOSCMessage(msg);
}

void sendOSCMessage(OSCMessage& msg) {
  Udp.beginPacket(outIp, outPort);
  msg.send(Udp);
  Udp.endPacket(); // mark the end of the OSC Packet
  msg.empty();
}

void readPot() {
  // 4 sounds, 1024 max range, roughly 255 steps each
  // Check left Pot
  leftVal = analogRead(leftPin); // read the value from the sensor
  if (leftVal > lastLeftVal + potCheckInterval || leftVal < lastLeftVal - potCheckInterval)
  {
//        Serial.println("Pot is " + String(leftVal));
    lastLeftVal = leftVal;
    
    Serial.println("rhythmo/1/" + String(lastLeftVal));
    createRhythmoMessage(1, lastLeftVal);
  }

  // Check right Pot
  rightVal = analogRead(rightPin); // read the value from the sensor
  if (rightVal > lastRightVal + potCheckInterval || rightVal < lastRightVal - potCheckInterval)
  {
    //    Serial.println("Pot is " + String(rightVal));
    lastRightVal = rightVal;
    Serial.println("rhythmo/0/" + String(lastRightVal));
    createRhythmoMessage(0, lastRightVal);
  }
}

void checkPads() {
  val = analogRead(leftPadPin);    // read the value from the sensor
  //         Serial.println("Pot is " + String(val));

  //  if(val > lastPotVal + potCheckInterval || val < lastPotVal - potCheckInterval) {
  //    lastPotVal = val;
  //         Serial.println("Pot is " + String(val));
  //  }

  if (val > 80 && buh == false) {
    buh = true;
    Serial.println("rhythmo/2/1");
    createRhythmoMessage(2, 1);
    delay(150);
  }
  else if (val < 80 && buh == true) {
    buh = false;
    Serial.println("rhythmo/2/0");
    createRhythmoMessage(2, 0);
  }

  val2 = analogRead(rightPadPin);
  //           Serial.println(String(val2));

  if (val2 > 80 && buh2 == false) {
    buh2 = true;
    Serial.println("rhythmo/3/1");
    createRhythmoMessage(3, 1);
    delay(150);
  }
  else if (val2 < 80 && buh2 == true) {
    buh2 = false;
    Serial.println("rhythmo/3/0");
    createRhythmoMessage(3, 0);
  }

}

void checkButtonStatus() {
  //Serial.println("CHECKING BUTTON STATUS");
  for (int i = 0; i < 2; i++) {
    ButtonDebounce padCheck = padArr[i];
    padCheck.update();
    int padState = padStates[i];
    if (padCheck.state() != padState)
    {
      if (padCheck.state() == HIGH)
      {
        // send on signal over OSC
        createRhythmoMessage(i + 2, 1);
        Serial.println("Button " + String(i) + " Clicked");
      }
      else {
        // send off signal over OSC
      }
      padStates[i] = padCheck.state();
    }
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
