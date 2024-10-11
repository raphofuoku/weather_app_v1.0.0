// Select the elements
const getWeatherBtn = document.getElementById('get-weather-btn');
const cityInput = document.getElementById('city-input');
const cityName = document.getElementById('city-name');
const temperature = document.getElementById('temperature');
const weatherDescription = document.getElementById('weather-description');

// OpenWeatherMap API Key
const apiKey = '95f5aff8ce233290bc8f8df08e009c32';

// Function to fetch weather data
function getWeather() {
  const city = cityInput.value;

  if (!city) {
    alert('Please enter a city name.');
    return;
  }

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      if (data.cod === 200) {
        cityName.textContent = `${data.name}, ${data.sys.country}`;
        temperature.textContent = `Temperature: ${data.main.temp}°C`;
        weatherDescription.textContent = `Weather: ${data.weather[0].description}`;
      } else {
        alert('City not found!');
      }
    })
    .catch(error => console.error('Error fetching the weather data:', error));
}

// Event listener for button click
getWeatherBtn.addEventListener('click', getWeather);
