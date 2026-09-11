
#include <WiFi.h>
#include <HTTPClient.h>
#include <TFT_eSPI.h>
#include <TinyGPS++.h>
#include <ArduinoJson.h>
#include "time.h"

// ==============================
// Wi-Fi and Firebase Configuration
// ==============================

#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#define FIREBASE_URL ""

// ==============================
// Display and Serial Configuration
// ==============================

TFT_eSPI tft = TFT_eSPI();

HardwareSerial SerialUNO(2);
HardwareSerial SerialGPS(1);

#define UNO_RX 3
#define UNO_TX 1

#define GPS_RX 16
#define GPS_TX 17

TinyGPSPlus gps;

// ==============================
// Sensor Data
// ==============================

int mq = 0;

float temp = 0.0;
float hum = 0.0;

float lat = 0.0;
float lon = 0.0;

String recommendation = "";
String timestamp = "";

// ==============================
// Reading History
// ==============================

#define MAX_HISTORY 30

struct Reading {
    int mq;
    float temp;
    float hum;
    float lat;
    float lon;
    String time;
};

Reading history[MAX_HISTORY];
int historyIndex = 0;

// ==============================
// Time Configuration
// ==============================

const char* ntpServer = "pool.ntp.org";

const long gmtOffset_sec = 20700;
const int daylightOffset_sec = 0;


// ==============================
// Wi-Fi Connection
// ==============================

void connectWiFi() {

    if (WiFi.status() == WL_CONNECTED) {
        return;
    }

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
    }
}


// ==============================
// Get Current Time
// ==============================

String getTime() {

    struct tm timeinfo;

    if (!getLocalTime(&timeinfo)) {
        return "No Time";
    }

    char buffer[30];

    strftime(
        buffer,
        sizeof(buffer),
        "%d-%m-%Y %H:%M:%S",
        &timeinfo
    );

    return String(buffer);
}


// ==============================
// Calculate Distance
// ==============================

float distanceKm(
    float lat1,
    float lon1,
    float lat2,
    float lon2
) {

    float R = 6371.0;

    float dLat = radians(lat2 - lat1);
    float dLon = radians(lon2 - lon1);

    float a =
        sin(dLat / 2) * sin(dLat / 2) +
        cos(radians(lat1)) *
        cos(radians(lat2)) *
        sin(dLon / 2) *
        sin(dLon / 2);

    float c =
        2 * atan2(
            sqrt(a),
            sqrt(1 - a)
        );

    return R * c;
}


// ==============================
// Store Reading in History
// ==============================

void addHistory() {

    if (historyIndex == 0 ||
        distanceKm(
            history[historyIndex - 1].lat,
            history[historyIndex - 1].lon,
            lat,
            lon
        ) >= 1.0) {

        if (historyIndex < MAX_HISTORY) {

            history[historyIndex++] = {
                mq,
                temp,
                hum,
                lat,
                lon,
                timestamp
            };

        } else {

            for (int i = 1; i < MAX_HISTORY; i++) {
                history[i - 1] = history[i];
            }

            history[MAX_HISTORY - 1] = {
                mq,
                temp,
                hum,
                lat,
                lon,
                timestamp
            };
        }
    }
}


// ==============================
// Read Data from Arduino
// ==============================

bool readUNO() {

    if (SerialUNO.available()) {

        String line =
            SerialUNO.readStringUntil('\n');

        line.trim();

        int i1 = line.indexOf(',');
        int i2 = line.indexOf(',', i1 + 1);

        if (i2 > 0) {

            mq =
                line.substring(
                    0,
                    i1
                ).toInt();

            temp =
                line.substring(
                    i1 + 1,
                    i2
                ).toFloat();

            hum =
                line.substring(
                    i2 + 1
                ).toFloat();


            if (mq < 50) {

                recommendation = "Healthy";

            } else if (mq < 100) {

                recommendation = "Moderate";

            } else if (mq < 150) {

                recommendation = "Unhealthy";

            } else {

                recommendation = "Hazardous";
            }

            return true;
        }
    }

    return false;
}


// ==============================
// Read GPS Data
// ==============================

void readGPS() {

    while (SerialGPS.available()) {
        gps.encode(SerialGPS.read());
    }

    if (gps.location.isUpdated()) {

        lat = gps.location.lat();
        lon = gps.location.lng();
    }
}


// ==============================
// TFT Display
// ==============================

void showTFT() {

    tft.fillScreen(TFT_BLACK);

    int margin = 15;

    tft.setTextColor(TFT_WHITE);
    tft.setTextSize(3);
    tft.setCursor(40, margin);
    tft.println("AeroSense");

    tft.setTextSize(4);
    tft.setTextColor(TFT_GREEN);
    tft.setCursor(margin, 70);

    tft.print("AQI:");
    tft.println(mq);

    tft.setTextSize(3);
    tft.setTextColor(TFT_CYAN);
    tft.setCursor(margin, 130);

    tft.print("Temp:");
    tft.print(temp);
    tft.println("C");

    tft.setTextSize(3);
    tft.setTextColor(TFT_YELLOW);
    tft.setCursor(margin, 180);

    tft.println(recommendation);
}


// ==============================
// Send Data to Firebase
// ==============================

void sendToFirebase() {

    connectWiFi();

    if (WiFi.status() != WL_CONNECTED) {
        return;
    }

    HTTPClient http;

    http.begin(FIREBASE_URL);

    http.addHeader(
        "Content-Type",
        "application/json"
    );

    String json = "{";

    json += "\"mq\":" + String(mq) + ",";
    json += "\"temp\":" + String(temp) + ",";
    json += "\"hum\":" + String(hum) + ",";
    json += "\"lat\":" + String(lat, 6) + ",";
    json += "\"lon\":" + String(lon, 6) + ",";
    json += "\"status\":\"" + recommendation + "\",";
    json += "\"timestamp\":\"" + timestamp + "\"";

    json += "}";

    http.PUT(json);

    http.end();
}


// ==============================
// Setup
// ==============================

void setup() {

    Serial.begin(115200);

    SerialUNO.begin(
        9600,
        SERIAL_8N1,
        UNO_RX,
        UNO_TX
    );

    SerialGPS.begin(
        9600,
        SERIAL_8N1,
        GPS_RX,
        GPS_TX
    );

    tft.init();

    tft.setRotation(1);

    tft.fillScreen(TFT_BLACK);

    connectWiFi();

    configTime(
        gmtOffset_sec,
        daylightOffset_sec,
        ntpServer
    );
}


// ==============================
// Main Loop
// ==============================

void loop() {

    readGPS();

    if (readUNO()) {

        timestamp = getTime();

        addHistory();

        showTFT();

        sendToFirebase();
    }

    delay(2000);
}

