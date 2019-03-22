#include <Wire.h>
#include <WiFiNINA.h>
#include <WiFiUdp.h>
#include <OSCMessage.h>
#include <OSCBundle.h>
#include <ButtonDebounce.h>

///// NOTE ************
///// GREEN WIRE ON RGB IS FOR BLUE
///// BLUE WIRE ON RGB IS FOR GREEN
////// I MESSED UP
///*************

///////////////
//// DEBUG ////
///////////////
// Turn on to disable WIFI Connection to speed up testing
bool DEBUG = false;

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
///// POT /////
///////////////
const int leftPin = 1;
int leftVal = 0;
int lastLeftVal = 0;
const int rightPin = 0;
int rightVal = 0;
int lastRightVal = 0;
// Update this to increase or reduce the amount of times to do a check
// Depends on which intervals are for the physical dial
const int potCheckInterval = 75;

///////////////
///// POT /////
///////////////
const int sliderPin = 1;
int sliderVal = 0;
int lastSliderVal = 0;
// Update this to increase or reduce the amount of times to do a check
// Depends on which intervals are for the physical dial
const int sliderCheckInterval = 25;


void setup() 
{
  Serial.begin(115200);
  pinMode(A0, INPUT);
//  if(!DEBUG) {
//    Serial.println("Connecting to WIFI....");
//    connectWiFi();
//  }
//  else {
//    Serial.println("Starting in debug mode....no WIFI connection...");
//  }
}

void loop() 
{
  readPot();
  readSlider();
  checkButtonStatus();
  
}

void createPioMessage(int channelNumber, int inputVal) {
//  if(!DEBUG) {
//    OSCMessage msg("/pio");
//
//    // Add message channel
//    char channelBuffer[12];
//    msg.add(itoa(channelNumber, channelBuffer, 10));
//  
//    // Add message value
//    char valueBuffer[12];
//    msg.add(itoa(inputVal, valueBuffer, 10));
//  
//    sendOSCMessage(msg);
//  }
}

void sendOSCMessage(OSCMessage& msg) {
   Udp.beginPacket(outIp, outPort);
   msg.send(Udp);
   Udp.endPacket(); // mark the end of the OSC Packet
   msg.empty();
}

void readSlider() {
  // Check left Pot
  sliderVal = analogRead(sliderPin); // read the value from the sensor
  if (sliderVal > lastSliderVal + sliderCheckInterval || sliderVal < lastSliderVal - sliderCheckInterval)
  {
    lastSliderVal = sliderVal;
    createPioMessage(7, lastSliderVal);
  }
}

void readPot() {
  // 4 sounds, 1024 max range, roughly 255 steps each
  // Check left Pot
  leftVal = analogRead(leftPin); // read the value from the sensor
  if (leftVal > lastLeftVal + potCheckInterval || leftVal < lastLeftVal - potCheckInterval)
  {
    lastLeftVal = leftVal;
    Serial.println("pio/8/" + String(lastLeftVal));
    createPioMessage(8, lastLeftVal);
  }

  // Check right Pot
  rightVal = analogRead(rightPin); // read the value from the sensor
  if (rightVal > lastRightVal + potCheckInterval || rightVal < lastRightVal - potCheckInterval)
  {
    lastRightVal = rightVal;
    Serial.println("pio/9/" + String(lastRightVal));
    createPioMessage(9, lastRightVal);
  }
}

void checkButtonStatus() {
  //Serial.println("CHECKING BUTTON STATUS");
  for(int i = 0; i < 7; i++) {
    ButtonDebounce button = buttonArr[i];
    button.update();
    int buttonState = buttonStates[i];
    if(button.state() != buttonState){
      if(button.state() == HIGH) {
        // send on signal over OSC
        Serial.println("pio/" + String(i+2) + "/1");
        createPioMessage(i+2, 1);
      }
      else {
        // send off signal over OSC
        Serial.println("pio/" + String(i+2) + "/0");
        createPioMessage(i + 2, 0);
      }
      buttonStates[i] = button.state();
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
   // if you get a connection, report back via serial:
  Udp.begin(localPort);
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
