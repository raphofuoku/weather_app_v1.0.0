// Select the elements
const getWeatherBtn = document.getElementById('get-weather-btn');
const cityInput = document.getElementById('city-input');
const cityName = document.getElementById('city-name');
const temperature = document.getElementById('temperature');
const weatherDescription = document.getElementById('weather-description');
const container = document.querySelector('.container');
const body = document.querySelector('body');

// OpenWeatherMap API Key
const apiKey = 'secrets.WEATHER_API';

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

        // Change the background based on the weather condition
        const weather = data.weather[0].main.toLowerCase();
        setWeatherBackground(weather);
      } else {
        alert('City not found!');
      }
    })
    .catch(error => console.error('Error fetching the weather data:', error));
}

// Event listener for button click
getWeatherBtn.addEventListener('click', getWeather);

// Function to set weather background
function setWeatherBackground(weather) {
  body.className = ''; // Reset the body class
  switch (weather) {
    case 'clear':
      body.classList.add('sunny');
      break;
    case 'clouds':
      body.classList.add('cloudy');
      break;
    case 'rain':
    case 'drizzle':
      body.classList.add('rainy');
      break;
    case 'thunderstorm':
      body.classList.add('stormy');
      break;
    default:
      body.classList.add('clear');
      break;
  }
}
