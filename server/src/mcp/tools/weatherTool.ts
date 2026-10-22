import { z } from 'zod';

export const weatherSchema = z.object({
  city: z.string().min(1).describe('City or location name, e.g. "Seattle", "Tokyo", "London", "New York"'),
  units: z.enum(['celsius', 'fahrenheit']).optional().default('celsius').describe('Temperature unit: celsius (default) or fahrenheit')
});

export type WeatherInput = z.infer<typeof weatherSchema>;

// WMO Weather interpretation codes (WW)
const WMO_CODES: Record<number, string> = {
  0: 'Clear sky ☀️',
  1: 'Mainly clear 🌤️',
  2: 'Partly cloudy ⛅',
  3: 'Overcast ☁️',
  45: 'Foggy 🌫️',
  48: 'Depositing rime fog 🌫️',
  51: 'Light drizzle 🌦️',
  53: 'Moderate drizzle 🌦️',
  55: 'Dense drizzle 🌧️',
  61: 'Slight rain 🌧️',
  63: 'Moderate rain 🌧️',
  65: 'Heavy rain 🌧️',
  71: 'Slight snowfall 🌨️',
  73: 'Moderate snowfall 🌨️',
  75: 'Heavy snowfall ❄️',
  77: 'Snow grains ❄️',
  80: 'Slight rain showers 🌦️',
  81: 'Moderate rain showers 🌧️',
  82: 'Violent rain showers ⛈️',
  85: 'Slight snow showers 🌨️',
  86: 'Heavy snow showers ❄️',
  95: 'Thunderstorm ⛈️',
  96: 'Thunderstorm with slight hail ⛈️',
  99: 'Thunderstorm with heavy hail ⛈️'
};

export async function executeGetWeather(input: WeatherInput) {
  const city = input.city.trim();
  const units = input.units || 'celsius';

  try {
    // 1. Geocoding lookup via Open-Meteo free API (no key needed!)
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(4000) });
    
    if (geoRes.ok) {
      const geoData: any = await geoRes.json();
      if (geoData.results && geoData.results.length > 0) {
        const place = geoData.results[0];
        const lat = place.latitude;
        const lon = place.longitude;
        const country = place.country || '';
        const admin1 = place.admin1 || '';

        // 2. Fetch current weather
        const tempUnitParam = units === 'fahrenheit' ? '&temperature_unit=fahrenheit' : '';
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m${tempUnitParam}`;
        const weatherRes = await fetch(weatherUrl, { signal: AbortSignal.timeout(4000) });

        if (weatherRes.ok) {
          const wData: any = await weatherRes.json();
          const curr = wData.current;
          const weatherDesc = WMO_CODES[curr.weather_code] || 'Partly cloudy ⛅';
          const tempUnit = units === 'fahrenheit' ? '°F' : '°C';

          return {
            success: true,
            isLive: true,
            source: 'Open-Meteo Real-Time Weather API',
            location: {
              name: place.name,
              region: admin1,
              country,
              latitude: lat,
              longitude: lon
            },
            current: {
              temperature: `${curr.temperature_2m} ${tempUnit}`,
              feelsLike: `${curr.apparent_temperature} ${tempUnit}`,
              condition: weatherDesc,
              humidity: `${curr.relative_humidity_2m}%`,
              windSpeed: `${curr.wind_speed_10m} km/h`,
              precipitation: `${curr.precipitation} mm`,
              isDay: curr.is_day === 1
            },
            formattedSummary: `The current weather in ${place.name}, ${country || admin1} is ${weatherDesc} with a temperature of ${curr.temperature_2m}${tempUnit} (feels like ${curr.apparent_temperature}${tempUnit}). Humidity is at ${curr.relative_humidity_2m}% with winds at ${curr.wind_speed_10m} km/h.`
          };
        }
      }
    }
  } catch (error) {
    // Graceful fallback to demo data
    console.log(`[Weather] Network request to live API failed or timed out. Falling back to demo data for "${city}".`);
  }

  // Fallback demo data clearly labeled as simulated
  const tempC = Math.floor(18 + (city.length * 3) % 12);
  const tempF = Math.round((tempC * 9/5) + 32);
  const temp = units === 'fahrenheit' ? `${tempF} °F` : `${tempC} °C`;
  const conditions = ['Sunny ☀️', 'Partly Cloudy ⛅', 'Clear Sky 🌤️', 'Breezy 🍃', 'Mild & Pleasant 🌸'];
  const condition = conditions[city.length % conditions.length];

  return {
    success: true,
    isLive: false,
    source: 'AlexaX Demo Weather Service (Fallback)',
    notice: 'Demo data: Live weather API unavailable or offline.',
    location: {
      name: city,
      region: 'Simulated Region',
      country: 'Demo Location'
    },
    current: {
      temperature: temp,
      feelsLike: temp,
      condition,
      humidity: '58%',
      windSpeed: '12 km/h',
      precipitation: '0.0 mm',
      isDay: true
    },
    formattedSummary: `[DEMO DATA] The weather in ${city} is currently ${condition} at ${temp} with 58% humidity and gentle winds.`
  };
}
