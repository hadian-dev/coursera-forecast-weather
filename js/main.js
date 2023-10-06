function main() {
  let cityList = [];
  let weatherDataList = [];

  const selectCityElement = document.querySelector('#selectCity');
  const contentElement = document.querySelector('#content');
  const convertSwitchElement = document.querySelector('#converterSwitch');

  // Fetch City coordinates
  fetch('./city_coordinates.csv').then(async (data) => {
    const text = await data.text();
    cityList = text
      .split('\n')
      .slice(1)
      .map((cityItem) => {
        const [latitude, longitude, city, country] = cityItem.split(',');
        return { latitude, longitude, city, country };
      });

    // Create city options
    cityList.forEach((city) => {
      const optionEl = createElement('option', {
        attributes: [
          { key: 'value', value: `${city.latitude},${city.longitude}` },
        ],
        children: [`${city.city}, ${city.country}`],
      });
      selectCityElement.appendChild(optionEl);
    });
  });

  // On city select
  selectCityElement.onchange = (e) => {
    contentElement.innerHTML = '';

    const selectedValue = e.target.value;
    const [latitude, longitude] = selectedValue.split(',');

    // Create Spinner element
    const spinnerEl = createElement('div', {
      attributes: [{ key: 'class', value: 'spinner' }],
    });
    contentElement.appendChild(spinnerEl);

    // Fetch weather data
    fetchWeatherData({
      latitude,
      longitude,
      onError: () => {
        contentElement.removeChild(spinnerEl);
        const errorMessageEl = createElement('div', {
          attributes: [{ key: 'class', value: 'error-message' }],
          children: [
            createElement('h2', { children: ['Fetch data was unsuccessful!'] }),
            createElement('p', {
              children: ['There was an error fetching data, please try again.'],
            }),
          ],
        });
        contentElement.appendChild(errorMessageEl);
      },
      onSuccess: (data) => {
        weatherDataList = data;
        const unit = convertSwitchElement?.checked ? 'F' : 'C';
        const weatherListElem = createWeatherList(data, unit);

        contentElement.innerHTML = '';
        contentElement.appendChild(weatherListElem);
      },
    });
  };

  // On convert switch
  convertSwitchElement.onchange = (e) => {
    let weatherListElem;

    if (e.target.checked) {
      const fahrenheitWeathers = weatherDataList.map((item) => ({
        ...item,
        temp2m: {
          max: celsiusToFahrenheit(item.temp2m.max).toFixed(1),
          min: celsiusToFahrenheit(item.temp2m.min).toFixed(1),
        },
      }));

      weatherListElem = createWeatherList(fahrenheitWeathers, 'F');
    } else {
      weatherListElem = createWeatherList(weatherDataList);
    }
    contentElement.innerHTML = '';
    contentElement.appendChild(weatherListElem);
  };
}

// Fetch city Weather data
async function fetchWeatherData(
  input = { latitude: 0, longitude: 0, onError: null, onSuccess: null }
) {
  const { onError, onSuccess, latitude, longitude } = input;

  try {
    if ((!onError || !onSuccess || !latitude, !latitude)) {
      throw new Error('Invalid input');
    }

    const response = await fetch(
      `https://www.7timer.info/bin/api.pl?lat=${latitude}&lon=${longitude}&product=civillight&output=json`
    );

    if (response) {
      const { dataseries } = await response.json();
      onSuccess(dataseries);
    } else {
      onError();
    }
  } catch (error) {
    console.log(error);
    onError();
  }
}

const WEATHER_STATE = {
  clear: 'Sunny',
  cloudy: 'Cloudy',
  mcloudy: 'Mostly cloudy',
  pcloudy: 'Partly cloudy',
  ishower: 'Isolated showers',
  oshower: 'Occasional showers',
  lightrain: 'Light rain',
  foggy: 'Foggy',
  humid: 'Humid',
  snow: 'Snow',
  rainsnow: 'Rain snow',
  rain: 'Rain',
  frzr: 'Freeze',
  icep: 'Ice pellets',
  windy: 'Windy',
};

// Create Weather list element
function createWeatherList(weathers, unit = 'C') {
  // Create weather card
  const createCardElem = (
    input = { date: 0, temp2m: { max: 0, min: 0 }, weather: '' }
  ) => {
    const { weather, date: dateNum, temp2m } = input;
    // convert date to string
    const date = `${dateNum}`.replace(/(\d{4})(\d{2})(\d{2})/, '$1/$2/$3');
    const dayNum = date.replace(/(\d{4}\/)/g, '');

    const today = new Date().toLocaleDateString('en', { weekday: 'short' });
    const dateName = new Date(date).toLocaleDateString('en', {
      weekday: 'short',
    });
    const dayName = dateName === today ? 'Today' : dateName;

    // Head Element
    const head = createElement('div', {
      attributes: [{ key: 'class', value: 'card-head' }],
      children: [
        createElement('h3', { children: [dayName] }),
        createElement('h5', { children: [dayNum] }),
      ],
    });

    // Image Element
    const image = createElement('img', {
      attributes: [
        { key: 'src', value: `../images/${weather}.png` },
        { key: 'alt', value: WEATHER_STATE[weather] },
      ],
    });

    // Title Element
    const title = createElement('h4', { children: [WEATHER_STATE[weather]] });

    // Max Temperature Element
    const maxTemp = createElement('h3', {
      attributes: [{ key: 'class', value: 'max-temp' }],
      children: [
        createElement('strong', {
          children: [temp2m.max, createElement('sup', { children: ['°'] })],
        }),
        unit,
      ],
    });

    // Min Temperature Element
    const minTemp = createElement('h3', {
      attributes: [{ key: 'class', value: 'min-temp' }],
      children: [temp2m.min, createElement('sup', { children: ['°'] }), unit],
    });

    // Temp Wrapper Element
    const tempWrapper = createElement('div', {
      attributes: [{ key: 'class', value: 'temp-wrap' }],
      children: [
        createElement('div', {
          children: [maxTemp, minTemp],
        }),
      ],
    });

    // Return card Element
    return createElement('div', {
      attributes: [{ key: 'class', value: 'weather-card' }],
      children: [head, image, title, tempWrapper],
    });
  };

  // Create card elements
  const children = weathers.map(createCardElem);
  const weatherListElem = createElement('div', {
    attributes: [{ key: 'class', value: 'weather-list' }],
    children,
  });

  return weatherListElem;
}

// Convert celsius to fahrenheit
function celsiusToFahrenheit(temp = 0) {
  // return (temp * 9) / 5 + 32;
  return temp * (9 / 5) + 32;
}

function createElement(
  type = 'div',
  options = { attributes: [], children: [] }
) {
  const elem = document.createElement(type);

  options.attributes?.forEach((attr) => {
    elem.setAttribute(attr.key, attr.value);
  });

  options.children?.forEach((child) => {
    if (typeof child !== 'object') {
      elem.append(child);
    } else {
      elem.appendChild(child);
    }
  });

  return elem;
}

main();
