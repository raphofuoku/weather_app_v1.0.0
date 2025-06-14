class SkyVibe {
    constructor() {
        // DOM elements
        this.searchBtn = document.getElementById('searchBtn');
        this.cityInput = document.getElementById('cityInput');
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('errorMessage');
        this.weatherDisplay = document.getElementById('weatherDisplay');
        this.themeToggle = document.getElementById('themeToggle');
        this.forecastGrid = document.getElementById('forecastGrid');

        // App state
        this.currentTheme = 'default';
        this.themes = ['default', 'ocean', 'sunset', 'forest', 'cosmic'];
        this.currentThemeIndex = 0;

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        // Event listeners
        this.searchBtn.addEventListener('click', () => this.getWeather());
        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.getWeather();
        });
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Keyboard navigation
        this.cityInput.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));

        // Load weather for user's location or default city
        this.getWeatherByCoords();

        // Announce app ready for screen readers
        this.announceToScreenReader('SkyVibe weather app loaded. Enter a city name to get weather information.');
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboardNavigation(e) {
        if (e.key === 'Escape') {
            this.cityInput.blur();
        }
    }

    /**
     * Toggle between different theme backgrounds
     */
    toggleTheme() {
        this.currentThemeIndex = (this.currentThemeIndex + 1) % this.themes.length;
        const theme = this.themes[this.currentThemeIndex];

        const themeGradients = {
            default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            ocean: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)',
            sunset: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
            forest: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
            cosmic: 'linear-gradient(135deg, #4c1130 0%, #8e4b92 100%)'
        };

        document.body.style.background = themeGradients[theme];
        this.announceToScreenReader(`Theme changed to ${theme}`);
    }

    /**
     * Get weather data using user's geolocation
     */
    async getWeatherByCoords() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    await this.fetchWeatherData(latitude, longitude);
                },
                () => {
                    // Fallback to default city if geolocation fails
                    this.cityInput.value = 'London';
                    this.getWeather();
                }
            );
        } else {
            // Fallback for browsers without geolocation support
            this.cityInput.value = 'London';
            this.getWeather();
        }
    }

    /**
     * Get weather data for a specific city
     */
    async getWeather() {
        const city = this.cityInput.value.trim();
        if (!city) {
            this.showError('Please enter a city name');
            this.cityInput.focus();
            return;
        }

        this.showLoading();
        this.announceToScreenReader(`Searching for weather in ${city}`);

        try {
            // Get coordinates for the city using geocoding API
            const geoResponse = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
            );
            const geoData = await geoResponse.json();

            if (!geoData.results || geoData.results.length === 0) {
                throw new Error('City not found');
            }

            const { latitude, longitude, name, country } = geoData.results[0];
            await this.fetchWeatherData(latitude, longitude, name, country);

        } catch (error) {
            this.showError('Unable to fetch weather data. Please check the city name and try again.');
            console.error('Weather fetch error:', error);
            this.announceToScreenReader('Error fetching weather data. Please try again.');
        }
    }

    /**
     * Fetch weather data from Open-Meteo API
     */
    async fetchWeatherData(lat, lon, cityName = '', country = '') {
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility,uv_index,surface_pressure&hourly=temperature_2m,weather_code&timezone=auto`
            );

            const data = await response.json();

            // If city name is not provided, use reverse geocoding
            if (!cityName) {
                const geoResponse = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1`
                );
                const geoData = await geoResponse.json();
                if (geoData.results && geoData.results.length > 0) {
                    cityName = geoData.results[0].name;
                    country = geoData.results[0].country;
                }
            }

            this.displayWeather(data, cityName, country);
            this.displayForecast(data);
            this.hideLoading();

        } catch (error) {
            this.showError('Unable to fetch weather data. Please try again.');
            console.error('Weather API error:', error);
        }
    }

    /**
     * Display weather data in the UI
     */
    displayWeather(data, cityName, country) {
        const current = data.current;
        const weatherCode = current.weather_code;

        // Update display elements
        document.getElementById('cityName').textContent = `${cityName}, ${country}`;
        document.getElementById('temperature').textContent = `${Math.round(current.temperature_2m)}°`;
        document.getElementById('feelsLike').textContent = `${Math.round(current.apparent_temperature)}°C`;
        document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
        document.getElementById('windSpeed').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
        document.getElementById('visibility').textContent = `${Math.round(current.visibility / 1000)} km`;
        document.getElementById('uvIndex').textContent = current.uv_index || 'N/A';
        document.getElementById('pressure').textContent = `${Math.round(current.surface_pressure)} hPa`;

        // Set weather icon and description
        const weatherInfo = this.getWeatherInfo(weatherCode);
        document.getElementById('weatherIcon').innerHTML = weatherInfo.icon;
        document.getElementById('weatherDescription').textContent = weatherInfo.description;

        // Change background based on weather
        this.setWeatherBackground(weatherInfo.type);

        // Show weather display with animation
        this.showWeatherDisplay();

        // Announce weather info to screen readers
        this.announceToScreenReader(
            `Weather for ${cityName}, ${country}. ${weatherInfo.description}. Temperature ${Math.round(current.temperature_2m)} degrees. Feels like ${Math.round(current.apparent_temperature)} degrees.`
        );
    }

    /**
     * Display 5-hour forecast
     */
    displayForecast(data) {
        const hourlyTemp = data.hourly.temperature_2m;
        const hourlyCode = data.hourly.weather_code;
        const hourlyTime = data.hourly.time;

        this.forecastGrid.innerHTML = '';

        for (let i = 1; i <= 5; i++) {
            const time = new Date(hourlyTime[i]);
            const temp = Math.round(hourlyTemp[i]);
            const weatherInfo = this.getWeatherInfo(hourlyCode[i]);

            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <div class="forecast-time">${time.getHours()}:00</div>
                <div class="forecast-icon" aria-hidden="true">${weatherInfo.icon}</div>
                <div class="forecast-temp">${temp}°</div>
            `;
            forecastItem.setAttribute('aria-label', `${time.getHours()}:00, ${weatherInfo.description}, ${temp} degrees`);

            this.forecastGrid.appendChild(forecastItem);
        }
    }

    /**
     * Get weather information based on weather code
     */
    getWeatherInfo(code) {
        const weatherCodes = {
            0: { icon: '☀️', description: 'Clear sky', type: 'sunny' },
            1: { icon: '🌤️', description: 'Mainly clear', type: 'sunny' },
            2: { icon: '⛅', description: 'Partly cloudy', type: 'cloudy' },
            3: { icon: '☁️', description: 'Overcast', type: 'cloudy' },
            45: { icon: '🌫️', description: 'Foggy', type: 'cloudy' },
            48: { icon: '🌫️', description: 'Depositing rime fog', type: 'cloudy' },
            51: { icon: '🌦️', description: 'Light drizzle', type: 'rainy' },
            53: { icon: '🌦️', description: 'Moderate drizzle', type: 'rainy' },
            55: { icon: '🌧️', description: 'Dense drizzle', type: 'rainy' },
            56: { icon: '🌨️', description: 'Light freezing drizzle', type: 'snowy' },
            57: { icon: '🌨️', description: 'Dense freezing drizzle', type: 'snowy' },
            61: { icon: '🌧️', description: 'Slight rain', type: 'rainy' },
            63: { icon: '🌧️', description: 'Moderate rain', type: 'rainy' },
            65: { icon: '🌧️', description: 'Heavy rain', type: 'rainy' },
            66: { icon: '🌨️', description: 'Light freezing rain', type: 'snowy' },
            67: { icon: '🌨️', description: 'Heavy freezing rain', type: 'snowy' },
            71: { icon: '🌨️', description: 'Slight snow', type: 'snowy' },
            73: { icon: '🌨️', description: 'Moderate snow', type: 'snowy' },
            75: { icon: '❄️', description: 'Heavy snow', type: 'snowy' },
            77: { icon: '🌨️', description: 'Snow grains', type: 'snowy' },
            80: { icon: '🌦️', description: 'Slight rain showers', type: 'rainy' },
            81: { icon: '🌧️', description: 'Moderate rain showers', type: 'rainy' },
            82: { icon: '🌧️', description: 'Violent rain showers', type: 'rainy' },
            85: { icon: '🌨️', description: 'Slight snow showers', type: 'snowy' },
            86: { icon: '❄️', description: 'Heavy snow showers', type: 'snowy' },
            95: { icon: '⛈️', description: 'Thunderstorm', type: 'stormy' },
            96: { icon: '⛈️', description: 'Thunderstorm with slight hail', type: 'stormy' },
            99: { icon: '⛈️', description: 'Thunderstorm with heavy hail', type: 'stormy' }
        };

        return weatherCodes[code] || { icon: '🌤️', description: 'Unknown', type: 'cloudy' };
    }

    /**
     * Set weather-based background theme
     */
    setWeatherBackground(weatherType) {
        // Remove existing weather classes
        document.body.classList.remove('sunny', 'cloudy', 'rainy', 'snowy', 'stormy');

        // Add new weather class
        document.body.classList.add(weatherType);

        // Update CSS custom property for weather overlay
        const overlays = {
            sunny: 'radial-gradient(circle at 30% 20%, rgba(255, 255, 0, 0.3) 0%, transparent 50%)',
            cloudy: 'linear-gradient(rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            rainy: 'linear-gradient(transparent 0%, rgba(0, 100, 255, 0.1) 100%)',
            snowy: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.3) 2px, transparent 3px)',
            stormy: 'linear-gradient(45deg, transparent 40%, rgba(255, 255, 0, 0.1) 50%, transparent 60%)'
        };

        document.documentElement.style.setProperty('--weather-overlay', overlays[weatherType] || 'transparent');
    }

    /**
     * Show weather display with staggered animations
     */
    showWeatherDisplay() {
        this.weatherDisplay.style.display = 'block';
        setTimeout(() => {
            const elements = document.querySelectorAll('.city-name, .weather-main, .weather-description, .weather-details, .forecast-container');
            elements.forEach((el, index) => {
                setTimeout(() => el.classList.add('show'), index * 100);
            });
        }, 100);
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.loading.style.display = 'block';
        this.weatherDisplay.style.display = 'none';
        this.errorMessage.style.display = 'none';

        // Set focus to loading for screen readers
        this.loading.setAttribute('tabindex', '-1');
        this.loading.focus();
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        this.loading.style.display = 'none';
        this.loading.removeAttribute('tabindex');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.loading.style.display = 'none';

        // Set focus to error message for screen readers
        this.errorMessage.setAttribute('tabindex', '-1');
        this.errorMessage.focus();

        // Auto-hide error after 5 seconds
        setTimeout(() => {
            this.errorMessage.style.display = 'none';
            this.errorMessage.removeAttribute('tabindex');
        }, 5000);
    }

    /**
     * Announce message to screen readers
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    /**
     * Get UV Index description
     */
    getUVDescription(uvIndex) {
        if (uvIndex <= 2) return 'Low';
        if (uvIndex <= 5) return 'Moderate';
        if (uvIndex <= 7) return 'High';
        if (uvIndex <= 10) return 'Very High';
        return 'Extreme';
    }

    /**
     * Format pressure with trend indicator
     */
    formatPressure(pressure) {
        const standardPressure = 1013.25;
        const trend = pressure > standardPressure ? '↑' : pressure < standardPressure ? '↓' : '→';
        return `${Math.round(pressure)} ${trend}`;
    }

    /**
     * Get wind direction from degrees
     */
    getWindDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SkyVibe();
});

// Service Worker Registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}