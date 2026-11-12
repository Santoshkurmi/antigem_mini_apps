// Shared by the app and background.js: weather codes and the forecast URL.
(function (g) {
  const CODES = {
    0: ['☀️', 'Clear'], 1: ['🌤️', 'Mostly clear'], 2: ['⛅', 'Partly cloudy'], 3: ['☁️', 'Overcast'],
    45: ['🌫️', 'Fog'], 48: ['🌫️', 'Rime fog'], 51: ['🌦️', 'Light drizzle'], 53: ['🌦️', 'Drizzle'], 55: ['🌧️', 'Heavy drizzle'],
    61: ['🌦️', 'Light rain'], 63: ['🌧️', 'Rain'], 65: ['🌧️', 'Heavy rain'], 66: ['🌧️', 'Freezing rain'], 67: ['🌧️', 'Freezing rain'],
    71: ['🌨️', 'Light snow'], 73: ['🌨️', 'Snow'], 75: ['❄️', 'Heavy snow'], 77: ['🌨️', 'Snow grains'],
    80: ['🌦️', 'Showers'], 81: ['🌧️', 'Showers'], 82: ['⛈️', 'Violent showers'], 85: ['🌨️', 'Snow showers'], 86: ['🌨️', 'Snow showers'],
    95: ['⛈️', 'Thunderstorm'], 96: ['⛈️', 'Thunderstorm, hail'], 99: ['⛈️', 'Thunderstorm, hail'],
  };
  g.Sky = {
    code: c => CODES[c] || ['🌡️', 'Unknown'],
    url: (city, units) => 'https://api.open-meteo.com/v1/forecast?latitude=' + city.lat + '&longitude=' + city.lon +
      '&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m' +
      '&hourly=temperature_2m,precipitation_probability' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto' +
      (units === 'imperial' ? '&temperature_unit=fahrenheit&wind_speed_unit=mph' : ''),
    /** Highest rain probability over the next [hours] hours. */
    rainSoon: (data, hours) => {
      const now = Date.now(), times = data.hourly.time, p = data.hourly.precipitation_probability;
      let max = 0;
      for (let i = 0; i < times.length; i++) {
        const t = new Date(times[i]).getTime();
        if (t >= now - 3600e3 && t <= now + hours * 3600e3) max = Math.max(max, p[i] || 0);
      }
      return max;
    },
  };
})(globalThis);
