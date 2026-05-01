#include <Arduino.h>
#include <WiFi.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <LiquidCrystal.h>

//  WIFI 
const char* ssid     = "sc-3ed0";
const char* password = "Q1AM6LZDT2M1";

//  PINES 
#define ONE_WIRE_BUS       4
#define PIN_TURBIDEZ      32
#define PIN_CONDUCTIVIDAD 33
#define PIN_PH            34

#define LED_VERDE     25
#define LED_AMARILLO  26
#define LED_ROJO      27

//  LCD 
LiquidCrystal lcd(19, 23, 18, 17, 16, 15);

//  SENSOR TEMP 
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

//  VARIABLES 
float tempC = 0;
int turbidez = 0;
int conductividad = 0;
float ph = 0;

String nivelAlerta = "";
String msgEstado = "";

// 
// 1. initWiFi()
// 
void initWiFi() {
  WiFi.begin(ssid, password);
  lcd.clear();
  lcd.print("Conectando WiFi");

  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500);
    intentos++;
  }

  lcd.clear();
  if (WiFi.status() == WL_CONNECTED) {
    lcd.print("WiFi OK");
  } else {
    lcd.print("Sin WiFi");
  }
  delay(1500);
}

// 
// 2. readSensors()
// 
void readSensors() {

  sensors.requestTemperatures();
  tempC = sensors.getTempCByIndex(0);

  if (tempC == -127.00) {
    tempC = 25;
  }

  turbidez = analogRead(PIN_TURBIDEZ);
  conductividad = analogRead(PIN_CONDUCTIVIDAD);

  int rawPH = analogRead(PIN_PH);
  ph = map(rawPH, 0, 4095, 0, 1400) / 100.0;

  if (ph < 0 || ph > 14) ph = 7;
}


// 3. controlActuators()

void controlActuators() {

  digitalWrite(LED_VERDE, LOW);
  digitalWrite(LED_AMARILLO, LOW);
  digitalWrite(LED_ROJO, LOW);

  bool peligro =
    (tempC > 50) ||
    (turbidez > 800) ||
    (conductividad > 800) ||
    (ph < 4.5 || ph > 9.5);

  bool advertencia =
    (tempC < 10 || tempC > 35) ||
    (turbidez > 400) ||
    (conductividad > 400) ||
    (ph < 6 || ph > 8.5);

  if (peligro) {
    digitalWrite(LED_ROJO, HIGH);
    nivelAlerta = "PELIGRO";
    msgEstado   = "NO CONSUMIR";
  }
  else if (advertencia) {
    digitalWrite(LED_AMARILLO, HIGH);
    nivelAlerta = "ADVERTENCIA";
    msgEstado   = "REVISAR";
  }
  else {
    digitalWrite(LED_VERDE, HIGH);
    nivelAlerta = "CONSUMIBLE";
    msgEstado   = "APTA";
  }

  // LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("T:");
  lcd.print(tempC, 1);
  lcd.print(" pH:");
  lcd.print(ph, 1);

  lcd.setCursor(0, 1);
  lcd.print(nivelAlerta);

  delay(1500);
}


// 4. sendData()

void sendData() {

  Serial.print("{");
  Serial.print("\"temp\":"); Serial.print(tempC);
  Serial.print(",\"turb\":"); Serial.print(turbidez);
  Serial.print(",\"cond\":"); Serial.print(conductividad);
  Serial.print(",\"ph\":"); Serial.print(ph);
  Serial.print(",\"estado\":\""); Serial.print(nivelAlerta);
  Serial.println("\"}");
}


// 5. handleCommands()

void handleCommands() {

  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd == "ESTADO") {
      Serial.println("Estado actual:");
      Serial.println(nivelAlerta);
    }

    if (cmd == "DATOS") {
      sendData();
    }
  }
}


// SETUP

void setup() {
  Serial.begin(115200);

  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_AMARILLO, OUTPUT);
  pinMode(LED_ROJO, OUTPUT);

  lcd.begin(16, 2);
  sensors.begin();

  lcd.print("MEDIDOR AGUA");
  delay(2000);

  initWiFi();
}


// LOOP

void loop() {
  handleCommands();
  readSensors();
  controlActuators();
  sendData();
}