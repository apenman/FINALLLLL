#include <ButtonDebounce.h>

ButtonDebounce button1(2, 500);
ButtonDebounce button2(3, 500);

int button1State = LOW;
int button2State = LOW;
ButtonDebounce buttonArr[] = { button1, button2};
int buttonStates[] = { button1State, button2State };

void setup() {
  Serial.begin(115200);
}

void loop() {
  for(int i = 0; i < 2; i++) {
    ButtonDebounce button = buttonArr[i];
    int buttonState = buttonStates[i];
    button.update();
    if(button.state() != buttonState){
      Serial.println("Button " + String(i) + " Clicked");
      if(button.state() == HIGH) {
        // send on signal over OSC
      }
      else {
        // send off signal over OSC
      }
      buttonStates[i] = button.state();
    }
  }
}
