# Aerosense
A community scale system for monitoring, mapping, and analyzing air pollution exposure using distributed sensors, GPS, and a web dashboard.
git add .
# AeroSense

### Live Dashboard
https://aerosense-omega.vercel.app/

AeroSense is an air-quality monitoring and mapping project built with ESP32, Arduino, GPS, Firebase, and a web dashboard.

The ESP32 collects air-quality, temperature, humidity, and GPS data and sends it to Firebase. The web dashboard then displays the current readings, historical data, maps, and basic AQI analysis.

---

## What it does

- Monitors air quality using an MQ sensor
- Reads temperature and humidity
- Gets the device location using GPS
- Sends sensor data to Firebase
- Shows current readings on a web dashboard
- Displays sensor locations on a map
- Stores and displays previous readings
- Shows AQI, temperature, and humidity trends
- Finds the nearest sensor to a selected location
- Provides a simple next-day AQI prediction
- Allows users to request monitoring for a location

---

## Project Structure
AeroSense/
│
├── AeroSense.ino
├── index.html
├── analysis.html
├── request.html
├── script.js
├── style.css
└── README.md

### What each file does

| File            | Purpose                         |
| --------------- | ------------------------------- |
| `AeroSense.ino` | ESP32 firmware                  |
| `index.html`    | Main dashboard                  |
| `analysis.html` | Location and trend analysis     |
| `request.html`  | Location request page           |
| `script.js`     | Dashboard map and Firebase data |
| `style.css`     | Website styling                 |
| `README.md`     | Project documentation           |

---

# Setup

The project does not include any Wi-Fi or Firebase credentials.

You need to add your own configuration before running it.

There are **three places** you need to configure.

---

## 1. ESP32 Configuration

Open:

Near the top of the file, you will find:

```cpp
#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#define FIREBASE_URL ""
```

Add your own Wi-Fi and Firebase details.

For example:

```cpp
#define WIFI_SSID "Your_WiFi_Name"
#define WIFI_PASSWORD "Your_WiFi_Password"
#define FIREBASE_URL "https://your-project-default-rtdb.firebaseio.com/air_quality/current.json"
```

### Add:

* `WIFI_SSID` → your Wi-Fi name
* `WIFI_PASSWORD` → your Wi-Fi password
* `FIREBASE_URL` → your Firebase Realtime Database URL

The Firebase URL used by the ESP32 should point to:

air_quality/current.json


---

## 2. Firebase Configuration

Both `request.html` and `analysis.html` use Firebase.

Open:
request.html

and find:

```js
const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};
```

Add the configuration from your Firebase project.

You will need to do the same thing in:
analysis.html
The two files should normally use the same Firebase project as the ESP32.

Your configuration will look something like:

```js
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

Replace the placeholder values with the values from your own Firebase project.

---

## 3. Dashboard Firebase URLs

Open:
script.js


At the top you will find:

```js
const FIREBASE_CURRENT = "";
const FIREBASE_HISTORY = "";
```

Add your Firebase Realtime Database URLs.

For example:

```js
const FIREBASE_CURRENT =
    "https://your-project-default-rtdb.firebaseio.com/air_quality/current.json";

const FIREBASE_HISTORY =
    "https://your-project-default-rtdb.firebaseio.com/air_quality/history.json";
```

These are used by the main dashboard to load the current and historical sensor readings.

---

# Firebase Database

The project expects the data to be stored roughly like this:

```text
air_quality/
│
├── current/
│   ├── mq
│   ├── temp
│   ├── hum
│   ├── lat
│   ├── lon
│   ├── status
│   └── timestamp
│
└── history/
    ├── reading_1/
    │   ├── mq
    │   ├── temp
    │   ├── hum
    │   ├── lat
    │   ├── lon
    │   ├── status
    │   └── timestamp
    │
    ├── reading_2/
    │   └── ...
    │
    └── ...
```

The actual IDs under `history` can be different depending on how the data is written.

---

# Hardware

The current ESP32 code communicates with an Arduino and a GPS module.

The pins currently used in `AeroSense.ino` are:

```text
Arduino RX → GPIO 3
Arduino TX → GPIO 1

GPS RX → GPIO 16
GPS TX → GPIO 17
```

If your wiring is different, change the pin definitions in `AeroSense.ino`.

---

# Sensor Data

The ESP32 expects the Arduino sensor data in this format:

```text
mq,temp,hum
```

For example:

```text
75.4,27.2,61.5
```

Which means:

```text
MQ value    = 75.4
Temperature = 27.2 °C
Humidity    = 61.5 %
```

---

# Arduino / ESP32 Libraries

The ESP32 firmware uses:

* `WiFi.h`
* `HTTPClient.h`
* `TFT_eSPI.h`
* `TinyGPS++.h`
* `ArduinoJson.h`

Make sure the required libraries are installed before uploading the firmware.

---

# Running the Website

You can run the dashboard locally using VS Code and a local web server.

For example, install the **Live Server** extension in VS Code and open:

```text
index.html
```

Then choose:

```text
Open with Live Server
```

You can also deploy the website to a hosting service such as Vercel or GitHub Pages.

---

# Dashboard Pages

### Dashboard

`index.html`

This is the main page. It shows the latest sensor readings and the air-quality map.

### Analysis

`analysis.html`

This page lets you click on the map and find the nearest sensor. It also shows historical AQI, temperature, and humidity trends.

### Request

`request.html`

This page allows users to select a location and submit a request for air-quality monitoring.

---

# Important

Do not upload your personal credentials to GitHub.

Especially avoid committing:

Wi-Fi passwords
Firebase service-account files
Private API keys
Private access tokens

The blank configuration fields in this repository are intentional. Add your own values when setting up the project.

Also make sure your Firebase Realtime Database rules are configured properly before making the project public.

---

# Getting Started

If you're setting up AeroSense for the first time, the easiest order is:

1. Create your own Firebase project.
2. Enable Firebase Realtime Database.
3. Add the Firebase configuration to `request.html`.
4. Add the same Firebase configuration to `analysis.html`.
5. Add the Firebase current/history URLs to `script.js`.
6. Add your Wi-Fi and Firebase URL to `AeroSense.ino`.
7. Install the required Arduino libraries.
8. Upload the firmware to your ESP32.
9. Run or deploy the web dashboard.

---

# Live Dashboard

You can try the current dashboard here:

https://aerosense-omega.vercel.app/


**AeroSense — Measure, Map, and Understand Air Quality.**


