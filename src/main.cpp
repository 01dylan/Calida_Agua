#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h> // 🔒 Añadido para soporte HTTPS/SSL seguro
#include <ArduinoJson.h>      // 💻 Estructuración limpia del JSON de salida
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ================= CONFIGURACIÓN =================
const char* ssid = "Familia Hoyos";
const char* password = "69343665";
// Cambia esta URL por la de tu nuevo backend (ej. https://tu-backend.up.railway.app/api/...)
const char* serverURL = "https://amusing-kindness-production-8e11.up.railway.app/data"; 

// ================= HARDWARE =================
LiquidCrystal_I2C lcd(0x27, 16, 2);
#define ONE_WIRE_BUS 4
#define TDS_PIN 34
#define TURBIDITY_PIN 35
#define PH_PIN 33

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

#define LED_VERDE 25
#define LED_AMARILLO 26
#define LED_ROJO 27

// ================= VARIABLES =================
int TURB_LIMPIA = 1200;
int TDS_LIMPIO = 200;
int TDS_ALTO = 800;

float tempC;
int tdsValue;
int turbidityValue;
int phADC;
float phVoltage;
float pHValue;
bool pantalla = false;

void setup() {
  Serial.begin(115200);
  
  // Inicializamos I2C y bajamos la velocidad a 100KHz para máxima estabilidad
  Wire.begin(21, 22);
  Wire.setClock(100000); 
  
  lcd.init();
  lcd.backlight();
  lcd.print("Iniciando...");

  WiFi.begin(ssid, password);
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 10) {
    delay(500);
    Serial.print(".");
    intentos++;
  }

  sensors.begin();
  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_AMARILLO, OUTPUT);
  pinMode(LED_ROJO, OUTPUT);
  
  // Limpiamos el "Iniciando..." antes de entrar al loop
  lcd.clear();
  Serial.println("\nSistema Iniciado");
}

void loop() {
  // --- Lectura ---
  sensors.requestTemperatures();
  tempC = sensors.getTempCByIndex(0);
  tdsValue = analogRead(TDS_PIN);
  turbidityValue = analogRead(TURBIDITY_PIN);
  phADC = analogRead(PH_PIN);
  
  phVoltage = phADC * (3.3 / 4095.0);
  pHValue = 7 + ((2.5 - phVoltage) / 0.18);
  if (pHValue < 0) pHValue = 0; if (pHValue > 14) pHValue = 14;

  // --- Salida Serial (Monitor Serie) ---
  Serial.println("\n--- DATOS SENSORES ---");
  Serial.print("Temperatura: "); Serial.print(tempC); Serial.println(" C");
  Serial.print("TDS: "); Serial.print(tdsValue); Serial.println(" ppm");
  Serial.print("Turbidez: "); Serial.println(turbidityValue);
  Serial.print("ADC pH: "); Serial.println(phADC);
  Serial.print("Voltaje pH: "); Serial.print(phVoltage, 3); Serial.println(" V");
  Serial.print("pH Calculado: "); Serial.println(pHValue, 2);

  // --- Evaluación LEDS ---
  digitalWrite(LED_VERDE, LOW); digitalWrite(LED_AMARILLO, LOW); digitalWrite(LED_ROJO, LOW);
  if (tdsValue > TDS_ALTO) { digitalWrite(LED_ROJO, HIGH); }
  else if (tdsValue > TDS_LIMPIO || turbidityValue > TURB_LIMPIA) { digitalWrite(LED_AMARILLO, HIGH); }
  else { digitalWrite(LED_VERDE, HIGH); }

  // --- LCD (Optimizado sin lcd.clear) ---
  if (!pantalla) {
    // Fila 0
    lcd.setCursor(0, 0); 
    lcd.print("T:"); lcd.print(tempC, 0); lcd.print("C pH:"); lcd.print(pHValue, 1);
    lcd.print("    "); // Espacios para borrar residuos anteriores
    
    // Fila 1
    lcd.setCursor(0, 1); 
    lcd.print("TDS:"); lcd.print(tdsValue); lcd.print("ppm");
    lcd.print("    "); 
  } else {
    // Fila 0
    lcd.setCursor(0, 0); 
    lcd.print("Turb:"); lcd.print(turbidityValue);
    lcd.print("    "); 
    
    // Fila 1
    lcd.setCursor(0, 1); 
    lcd.print("ADC pH:"); lcd.print(phADC);
    lcd.print("    "); 
  }
  pantalla = !pantalla;

  // ================= ENVÍO DE DATOS MODIFICADO =================
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // Permite conectar a servidores HTTPS (como Railway) omitiendo la verificación estricta del SSL

    HTTPClient http;
    http.begin(client, serverURL); // Pasamos el cliente seguro junto con la URL
    http.addHeader("Content-Type", "application/json");

    // Construcción robusta del JSON usando ArduinoJson
    StaticJsonDocument<256> doc;
    doc["mac"] = WiFi.macAddress(); // Útil para identificar qué dispositivo envía los datos
    doc["temperatura"] = isnan(tempC) ? 0.0 : tempC;
    doc["tds"] = tdsValue;
    doc["turbidez"] = turbidityValue;
    doc["ph"] = pHValue;

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    Serial.println(">>> Enviando JSON: " + jsonPayload);

    // Ejecutar petición HTTP POST
    int httpResponseCode = http.POST(jsonPayload);
    Serial.print("HTTP Respuesta Código: "); Serial.println(httpResponseCode);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Respuesta del servidor: " + response);
    } else {
      Serial.print("Error en el envío. Código: "); Serial.println(http.errorToString(httpResponseCode).c_str());
    }
    
    http.end(); // Cerrar la conexión limpia
  } else {
    Serial.println("WiFi Desconectado. Intentando reconectar...");
    WiFi.begin(ssid, password);
  }
  // ==============================================================

  // Esperamos 2 segundos antes de la siguiente actualización de pantalla y envío
  delay(2000);
}