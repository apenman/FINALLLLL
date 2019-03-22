#include <Wire.h>
#include <WiFiNINA.h>
#include <WiFiUdp.h>
#include <OSCMessage.h>
#include <OSCBundle.h>

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


void setup() 
{
  Serial.begin(115200);
  
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

void loop() 
{
  OSCMessage msg("/bass");
//
//  msg.add(axOsc);
//  msg.add(ayOsc);
  msg.add("hi");
  Udp.beginPacket(outIp, outPort);
  msg.send(Udp);
//  accelBndl.send(Udp); // send the bytes to the SLIP stream
  Udp.endPacket(); // mark the end of the OSC Packet
//  //accelBndl.empty(); // empty the bundle to free room for a new one
  msg.empty();
  
//  Serial.print("Gyro X: "); Serial.print(g.gyro.x);   Serial.print(" dps");
//  Serial.print("\tY: "); Serial.print(g.gyro.y);      Serial.print(" dps");
//  Serial.print("\tZ: "); Serial.print(g.gyro.z);      Serial.println(" dps");

  Serial.println("Looping");
  delay(1000);
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
