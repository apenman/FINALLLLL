
int switch_pin = 0;  

void setup() {
    Serial.begin(115200);

  // put your setup code here, to run once:
  pinMode(switch_pin, INPUT_PULLUP);
}

void loop() {
  // put your main code here, to run repeatedly:
  Serial.println(digitalRead (switch_pin));
}
