const pages = ["today", "hourly", "10day", "monthly", "air", "allergy"];
const navItems = document.querySelectorAll(".nav-item");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const dynamicContent = document.getElementById("dynamicContent");
let lastCity = "Chennai"; // Default

function setActive(page) {
  navItems.forEach(item => {
    item.classList.toggle("active", item.dataset.page === page);
  });
}

// Listen to sidebar
navItems.forEach(item => {
  item.onclick = () => {
    setActive(item.dataset.page);
    renderPage(item.dataset.page, lastCity);
  };
});

// Listen to search
searchBtn.onclick = () => {
  const city = cityInput.value.trim();
  if(city) {
    lastCity = city;
    const active = document.querySelector(".nav-item.active").dataset.page || "today";
    renderPage(active, city);
  }
};
cityInput.addEventListener("keypress", e => {
  if(e.key === "Enter") {
    searchBtn.click();
  }
});

// Render Page
async function renderPage(page, city) {
  dynamicContent.innerHTML = `<div style="text-align:center;font-size:19px;color:#777;">Loading...</div>`;

  if(page==="today"){
    const weather = await fetchWeather(city);
    dynamicContent.innerHTML = buildTodayBox(weather);
  }
  if(page==="hourly"){
    const weather = await fetchWeather(city);
    dynamicContent.innerHTML = buildTodayBox(weather,true);
    renderHourlyGraph(weather.hourlyTemp, weather.hourlyTime);
  }
  if(page==="10day"){
    const weather = await fetchWeather(city);
    dynamicContent.innerHTML = buildTodayBox(weather,true);
    render10DayGraph(weather.dailyTemp, weather.dailyDay);
  }
  if(page==="monthly"){
    // For demo, repeat 10-day graph
    const weather = await fetchWeather(city);
    dynamicContent.innerHTML = buildTodayBox(weather,true);
    renderMonthlyGraph(weather.dailyTemp, weather.dailyDay);
  }
  if(page==="allergy"){
    dynamicContent.innerHTML = buildAllergyBox(city);
  }
  if(page==="air"){
    dynamicContent.innerHTML = buildAirQualityBox(city);
  }
}

// --- Helper Functions ---
// ✅ Real-time fetch using WeatherAPI.com
async function fetchWeather(city) {
  try {
    const apiKey = "b9e1a0d4e0d349c5a13102145251209"; // your WeatherAPI key
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=3&aqi=yes`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("City not found ❌");
    const data = await res.json();

    return {
      city: data.location.name,
      temp_C: data.current.temp_c,
      condition: data.current.condition.text,
      day: data.forecast.forecastday[0].day.maxtemp_c,
      night: data.forecast.forecastday[0].day.mintemp_c,
      humidity: data.current.humidity,
      feelsLike: data.current.feelslike_c,
      wind: data.current.wind_kph,
      hourlyTemp: data.forecast.forecastday[0].hour.map(h => h.temp_c),
      hourlyTime: data.forecast.forecastday[0].hour.map(h => h.time.slice(-5)),
      dailyTemp: data.forecast.forecastday.map(d => d.day.maxtemp_c),
      dailyDay: data.forecast.forecastday.map(d => d.date)
    };
  } catch (err) {
    dynamicContent.innerHTML = dynamicContent.innerHTML = `
  <div style="color:red; text-align:center; font-size:18px; margin-top:20px;">
    ⚠️ ${err.message} <br> Please enter a valid city name.
  </div>`;

    return {};
  }
}


// Smart notification logic (can insert real ML API here)
function smartNotifications(weather){
  // Fallback simple logic
  const temp = Number(weather.temp_C);
  const cond = (weather.condition||"").toLowerCase();
  const humidity = Number(weather.humidity);
  let healthTip = "";
  if(temp < 14) healthTip = "Cold weather: Stay warm and hydrated.";
  else if(temp > 32) healthTip = "Hot day: Drink water and avoid direct sun.";
  else if(humidity > 80) healthTip = "Humid: Wear light clothes and stay cool.";
  else healthTip = "Normal weather: Enjoy your day safely!";
  let travel = "";
  if(cond.includes("rain")) travel = "Rainy: Avoid unnecessary travel.";
  else if(cond.includes("clear")) travel = "Clear skies – safe to commute.";
  else travel = "Moderate weather – travel generally safe.";
  let activity = "";
  if(temp>=18 && temp<=27 && cond.includes("clear")) activity = "Perfect for outdoor activities!";
  else if(temp>35 || cond.includes("storm")) activity = "Too hot/stormy? Stay indoors and relax.";
  else if(cond.includes("rain")) activity = "Rainy: Indoor activities recommended.";
  else activity = "Good weather for outdoor fun!";
  return {healthTip:healthTip, travelAlert:travel, activityRec:activity};
}

// Build today box
function buildTodayBox(weather, showGraph){
  const notif = smartNotifications(weather);
  return `<div class="weather-main-box">
    <h2>${weather.city}</h2>
    <h1>${weather.temp_C}°C</h1>
    <p>${weather.condition}</p>
    <p><strong>Day</strong> ${weather.day}° • <strong>Night</strong> ${weather.night}°</p>
    <p><strong>Humidity:</strong> ${weather.humidity}%</p>
    <p><strong>Feels Like:</strong> ${weather.feelsLike}°C</p>
    <p><strong>Wind:</strong> ${weather.wind} km/h</p>
    <div class="ml-notifications">
      <h3>Smart Notifications</h3>
      <p>${notif.healthTip}</p>
      <p>${notif.travelAlert}</p>
      <p>${notif.activityRec}</p>
    </div>
    ${showGraph ? `<div id="graphArea"><canvas id="weatherGraph"></canvas></div>` : ""}
  </div>`;
}

// Graphs
function renderHourlyGraph(temps, times){
  setTimeout(()=>{
    const ctx = document.getElementById("weatherGraph").getContext("2d");
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: times,
        datasets: [{
          label: 'Hourly Temp (°C)',
          data: temps,
          borderColor: '#0077b6',
          backgroundColor: '#90e0ef55',
          tension: 0.3,
          fill: true,
          pointRadius: 3
        }]
      },
      options: { responsive:true, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true} } }
    });
  },200);
}
function render10DayGraph(temps, days){
  setTimeout(()=>{
    const ctx = document.getElementById("weatherGraph").getContext("2d");
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          label: 'Max Temp (°C)',
          data: temps,
          backgroundColor: '#0077b6', borderRadius:7
        }]
      },
      options: { responsive:true, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true} } }
    });
  },200);
}
function renderMonthlyGraph(temps, days){
  setTimeout(()=>{
    const ctx = document.getElementById("weatherGraph").getContext("2d");
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          label: 'Monthly Trend (Max °C)',
          data: temps,
          borderColor: '#023e8a',
          backgroundColor: '#caf0f899',
          tension: 0.2,
          fill: true
        }]
      },
      options: { responsive:true, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true} } }
    });
  },200);
}

// Air Quality & Allergy
function buildAirQualityBox(city){
  // Demo: stub
  return `<div class="air-quality-box">
    <h2>Air Quality in ${city}</h2>
    <p><strong>Index:</strong> 47 (Good)</p>
    <p><strong>PM2.5:</strong> 16 µg/m³</p>
    <p><strong>Advice:</strong> Air is clean. Outdoor activities recommended.</p>
  </div>`;
}
function buildAllergyBox(city){
  // Demo: stub
  return `<div class="allergy-box">
    <h2>Allergy Tracker - ${city}</h2>
    <p><strong>Pollen Count:</strong> Low</p>
    <p><strong>Recommendation:</strong> No major allergy risk today.</p>
  </div>`;
}

// Initial render
window.onload = () => {
  setActive("today");
  renderPage("today", lastCity);
}; 
