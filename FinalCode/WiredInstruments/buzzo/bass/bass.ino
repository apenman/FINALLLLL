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
unsigned int localPort = 2390;      // local port to listen on
const unsigned int outPort = 8001;          // remote port to receive OSC

///////////////
/// TOGGLES ///
///////////////
int toggle1pin = 0;  
int toggle2pin = 1;
int toggle3pin = 2;
int toggle4pin = 3;

int toggle1state = 0;
int toggle2state = 0;
int toggle3state = 0;
int toggle4state = 0;

int togglePins[] = {toggle1pin, toggle2pin, toggle3pin, toggle4pin};
int toggleStates[] = {toggle1state, toggle2state, toggle3state, toggle4state};

///////////////
/// BUTTONS ///
///////////////
ButtonDebounce button1(4, 500);
ButtonDebounce button2(5, 500);
ButtonDebounce button3(6, 500);
ButtonDebounce button4(7, 500);
ButtonDebounce button5(8, 500);

int button1State = LOW;
int button2State = LOW;
int button3State = LOW;
int button4State = LOW;
int button5State = LOW;

ButtonDebounce buttonArr[] = {button1, button2, button3, button4, button5};
int buttonStates[] = {button1State, button2State, button3State, button4State, button5State};

void setup() {
  Serial.begin(115200);

  pinMode(toggle1pin, INPUT_PULLUP);
  pinMode(toggle2pin, INPUT_PULLUP);
  pinMode(toggle3pin, INPUT_PULLUP);
  pinMode(toggle4pin, INPUT_PULLUP);

  connectWiFi();
  // if you get a connection, report back via serial:
  Udp.begin(localPort);
}

void loop() {
  checkToggles();
  checkButtonStatus();
}

void checkButtonStatus()
{
  //Serial.println("CHECKING BUTTON STATUS");
  for (int i = 0; i < 5; i++)
  {
    ButtonDebounce button = buttonArr[i];
    button.update();
    int buttonState = buttonStates[i];
    if (button.state() != buttonState)
    {
      if (button.state() == HIGH)
      {
        // send on signal over OSC
        createBuzzoMessage(i + 4, 1);
        Serial.println("Button " + String(i) + " On");
      }
      else
      {
        // send off signal over OSC
        createBuzzoMessage(i + 4, 0);
        Serial.println("Button " + String(i) + " Off");
      }
      buttonStates[i] = button.state();
    }
  }
}

void checkToggles() {
  for (int i = 0; i < 4; i++)
  {
    readToggle(i);
  }
}

void readToggle(int i) {
    int state = toggleStates[i];
    int reading = digitalRead(togglePins[i]);
    if(reading != state) {
      toggleStates[i] = reading;
      createBuzzoMessage(i, reading);
      Serial.println(String(i) + " SWITCH FLIPPED TO " + String(reading));
    }
}

// inputNumber = 0-indexed integers matching to each input on instrument
void createBuzzoMessage(int inputNumber, int inputVal) {
  OSCMessage msg("/buzzo");

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
