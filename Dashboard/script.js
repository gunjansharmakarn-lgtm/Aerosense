
// ==============================
// Firebase URLs
// ==============================

const FIREBASE_CURRENT = "";

const FIREBASE_HISTORY = "";


// ==============================
// Map
// ==============================

const map = L.map("map-container").setView(
    [27.55, 84.5],
    10
);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);


let deviceMarker = null;

let historyCircles = [];

let localHistory = [];

const mapTypeSelect =
    document.getElementById("mapType");


// ==============================
// Color Scale
// ==============================

function getColor(type, value) {

    if (type === "mq") {

        return value < 50
            ? "#00ff88"
            : value < 100
                ? "#ffff00"
                : value < 150
                    ? "#ff9933"
                    : "#ff4d4d";
    }


    if (type === "temp") {

        return value < 20
            ? "#66ccff"
            : value < 30
                ? "#ffb84d"
                : "#ff4d4d";
    }


    if (type === "hum") {

        return value < 40
            ? "#66ccff"
            : value < 70
                ? "#66ff99"
                : "#ffb84d";
    }

}


// ==============================
// Convert HEX to RGBA
// ==============================

function hexToRGBA(hex, alpha) {

    const r = parseInt(
        hex.substring(1, 3),
        16
    );

    const g = parseInt(
        hex.substring(3, 5),
        16
    );

    const b = parseInt(
        hex.substring(5, 7),
        16
    );

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


// ==============================
// Re-center Map
// ==============================

function recenterMap() {

    if (deviceMarker) {

        map.setView(
            deviceMarker.getLatLng(),
            15
        );

    }

}


// ==============================
// Draw Current Device
// ==============================

function drawDevice(data) {

    if (!data.lat || !data.lon) {
        return;
    }


    const type = mapTypeSelect.value;

    const value =
        type === "mq"
            ? data.mq
            : type === "temp"
                ? data.temp
                : data.hum;


    const color =
        getColor(type, value);


    if (deviceMarker) {
        map.removeLayer(deviceMarker);
    }


    deviceMarker = L.circleMarker(
        [
            data.lat,
            data.lon
        ],
        {
            radius: 14,
            fillColor: color,
            fillOpacity: 0.9,
            stroke: false
        }
    ).addTo(map);


    deviceMarker.bindPopup(`

        <b>AQI:</b> ${data.mq}<br>

        <b>Temp:</b> ${data.temp} °C<br>

        <b>Hum:</b> ${data.hum}%<br>

        <b>Status:</b> ${data.status}<br>

        <b>Time:</b> ${data.timestamp}

    `);

}


// ==============================
// Draw History
// ==============================

function drawHistory() {

    historyCircles.forEach(
        circle => map.removeLayer(circle)
    );

    historyCircles = [];


    const type = mapTypeSelect.value;


    localHistory.forEach(history => {

        if (!history.lat || !history.lon) {
            return;
        }


        const value =
            type === "mq"
                ? history.mq
                : type === "temp"
                    ? history.temp
                    : history.hum;


        const baseColor =
            getColor(type, value);


        const opacity = 0.3;


        const circle = L.circle(
            [
                history.lat,
                history.lon
            ],
            {
                radius: 100,
                fillColor:
                    hexToRGBA(
                        baseColor,
                        opacity
                    ),
                fillOpacity: opacity,
                stroke: false
            }
        ).addTo(map);


        circle.bindTooltip(

            `
            <b>AQI:</b> ${history.mq}<br>

            <b>Temp:</b> ${history.temp} °C<br>

            <b>Hum:</b> ${history.hum}%<br>

            <b>Time:</b> ${history.timestamp}
            `,

            {
                direction: "top"
            }

        );


        historyCircles.push(circle);

    });

}


// ==============================
// Update Map Legend
// ==============================

function updateLegend() {

    const legendDiv =
        document.getElementById(
            "readingsLegend"
        );


    if (!legendDiv) {
        return;
    }


    legendDiv.innerHTML = "";


    const type =
        mapTypeSelect.value;


    let items = [];


    if (type === "mq") {

        items = [

            {
                color: "#00ff88",
                label: "Healthy"
            },

            {
                color: "#ffff00",
                label: "Moderate"
            },

            {
                color: "#ff9933",
                label: "Unhealthy"
            },

            {
                color: "#ff4d4d",
                label: "Hazardous"
            }

        ];

    }


    if (type === "temp") {

        items = [

            {
                color: "#66ccff",
                label: "Cold"
            },

            {
                color: "#ffb84d",
                label: "Warm"
            },

            {
                color: "#ff4d4d",
                label: "Hot"
            }

        ];

    }


    if (type === "hum") {

        items = [

            {
                color: "#66ccff",
                label: "Low"
            },

            {
                color: "#66ff99",
                label: "Comfort"
            },

            {
                color: "#ffb84d",
                label: "High"
            }

        ];

    }


    items.forEach(item => {

        const div =
            document.createElement("div");


        div.className =
            "legend-item";


        div.innerHTML = `

            <div
                class="legend-color"
                style="background:${item.color}"
            ></div>

            <div class="legend-label">
                ${item.label}
            </div>

        `;


        legendDiv.appendChild(div);

    });

}


// ==============================
// Render Readings List
// ==============================

function renderReadingsList() {

    const readingsDiv =
        document.getElementById(
            "readingsList"
        );


    if (!readingsDiv) {
        return;
    }


    const latest =
        localHistory
            .slice(-10)
            .reverse();


    readingsDiv.innerHTML =
        latest.map(history => `

            <div class="reading-card">

                <p style="font-weight:700">
                    ${history.location || "Unknown"}
                </p>

                <p>
                    AQI:
                    <strong>
                        ${history.mq}
                    </strong>
                </p>

                <p>
                    Temp:
                    ${history.temp} °C
                </p>

                <p>
                    Hum:
                    ${history.hum}%
                </p>

            </div>

        `).join("");

}


// ==============================
// Health Advisory
// ==============================

function updateHealthAdvisory(aqi) {

    const advisoryDiv =
        document.getElementById(
            "healthAdvice"
        );


    if (!advisoryDiv) {
        return;
    }


    let adviceList = [];


    if (aqi <= 50) {

        adviceList = [

            "Air quality is good. Enjoy outdoor activities.",

            "No special precautions needed.",

            "Keep exercising outdoors as normal.",

            "Maintain a balanced diet and stay hydrated.",

            "Open windows to ventilate your room.",

            "No mask is generally required for healthy individuals.",

            "Encourage children to enjoy outdoor activities."

        ];

    }


    else if (aqi <= 100) {

        adviceList = [

            "Sensitive people should reduce prolonged outdoor exertion.",

            "Consider wearing a mask if you have respiratory concerns.",

            "Limit outdoor activities if you feel unwell.",

            "Keep windows closed during periods of heavy traffic.",

            "Use an indoor air purifier if available.",

            "Drink plenty of water to stay hydrated.",

            "Monitor for coughing or irritation."

        ];

    }


    else if (aqi <= 150) {

        adviceList = [

            "Avoid prolonged outdoor activities.",

            "Consider wearing a high-quality mask outdoors.",

            "Keep children and older adults indoors when possible.",

            "Close windows and use indoor air purification.",

            "Avoid strenuous outdoor exercise.",

            "Monitor for breathing difficulties.",

            "Stay hydrated and maintain a healthy diet."

        ];

    }


    else {

        adviceList = [

            "Stay indoors and keep windows closed.",

            "Use air purification where available.",

            "Wear a high-quality mask if going outside is unavoidable.",

            "Avoid outdoor activities.",

            "Limit exposure for sensitive individuals.",

            "Stay hydrated and rest.",

            "Seek medical attention if you feel seriously unwell.",

            "Reduce strenuous physical activity indoors."

        ];

    }


    const randomAdvice =
        adviceList[
            Math.floor(
                Math.random() *
                adviceList.length
            )
        ];


    advisoryDiv.innerHTML =
        randomAdvice;
}


// ==============================
// Fetch Current Data
// ==============================

async function fetchCurrent() {

    if (!FIREBASE_CURRENT) {
        console.warn(
            "Firebase current URL has not been configured."
        );

        return;
    }


    try {

        const response =
            await axios.get(
                FIREBASE_CURRENT
            );


        const data =
            response.data;


        if (!data) {
            return;
        }


        document.getElementById(
            "mq"
        ).innerText =
            data.mq ?? "--";


        document.getElementById(
            "temp"
        ).innerText =
            (data.temp ?? "--") +
            " °C";


        document.getElementById(
            "hum"
        ).innerText =
            (data.hum ?? "--") +
            " %";


        document.getElementById(
            "status"
        ).innerText =
            data.status ?? "--";


        updateHealthAdvisory(
            data.mq
        );


        drawDevice(data);

    }


    catch (error) {

        console.error(
            "Firebase current data error:",
            error
        );

    }

}


// ==============================
// Fetch History
// ==============================

async function fetchHistory() {

    if (!FIREBASE_HISTORY) {
        console.warn(
            "Firebase history URL has not been configured."
        );

        return;
    }


    try {

        const response =
            await axios.get(
                FIREBASE_HISTORY
            );


        const data =
            response.data;


        if (!data) {
            return;
        }


        localHistory =
            Object.values(data);


        drawHistory();

        renderReadingsList();

    }


    catch (error) {

        console.error(
            "Firebase history data error:",
            error
        );

    }

}


// ==============================
// Map Type Change
// ==============================

mapTypeSelect.addEventListener(
    "change",
    () => {

        drawDevice(
            localHistory.length
                ? localHistory[localHistory.length - 1]
                : {}
        );

        drawHistory();

        updateLegend();

    }
);


// ==============================
// Initialize
// ==============================

updateLegend();

fetchCurrent();

fetchHistory();


setInterval(
    () => {

        fetchCurrent();

        fetchHistory();

    },
    3000
);

