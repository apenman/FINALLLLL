///////////////
///// POT /////
///////////////
#include <ButtonDebounce.h>

const int potPin = 0;
int val = 0;
int lastPotVal = 0;
// Update this to increase or reduce the amount of times to do a check
// Depends on which intervals are for the physical dial
const int potCheckInterval = 25;
ButtonDebounce button(0, 500);
int buttonState = LOW;
bool buh = false;
void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
}

void loop() {
  // put your main code here, to run repeatedly:
  readPot();
// checkButtonStatus();
}

void readPot() {
  val = analogRead(potPin);    // read the value from the sensor
//         Serial.println("Pot is " + String(val));

  if(val > lastPotVal + potCheckInterval || val < lastPotVal - potCheckInterval) {
    lastPotVal = val;
         Serial.println("Pot is " + String(val));
  }

}

void checkButtonStatus() {
  //Serial.println("CHECKING BUTTON STATUS");
    button.update();
//    Serial.println(button.state());
    if(button.state() != buttonState){
      if(button.state() == HIGH) {
        // send on signal over OSC
        Serial.println("Button Clicked");
      }
      else {
        // send off signal over OSC
                Serial.println("Button Off");

      }

      buttonState = button.state();
    }
}
