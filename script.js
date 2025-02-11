'use strict';

const countriesContainer = document.querySelector('.countries');
const renderCountry = function (data, className = '') {
  const html = `
	<article class="country ${className}" data-country="${data.name.common}">
		<img class="country__img" src="${data.flags.svg}" />
		<div class="country__data">
			<h3 class="country__name">${data.name.common}</h3>
			<h4 class="country__region">${data.region}</h4>
			<p class="country__row"><span>👫</span>
			${(+data.population / 1_000_000).toFixed(1)}M people</p>
			<p class="country__row"><span>🗣️</span>${Object.values(data.languages)[0]}</p>
			<p class="country__row"><span>💰</span>${
        Object.values(data.currencies)[0].name
      } ${Object.values(data.currencies)[0].symbol}</p>
		</div>
	</article>
  ${className ? '' : '<button class="btn-country">Neighbours?</button>'}
	`;

  if (className == 'neighbour') {
    document.querySelector('.btn-country')?.remove();
    countriesContainer.insertAdjacentHTML('beforeend', html);
  } else countriesContainer.innerHTML = html;
  countriesContainer.style.opacity = 1;
};

const renderErr = function (msg) {
  countriesContainer.insertAdjacentHTML('beforeend', msg);
  countriesContainer.style.opacity = 1;
};

countriesContainer.addEventListener('click', function (e) {
  if (!e.target.classList.contains('btn-country')) return;
  console.log(e.target);
  let countryName =
    countriesContainer.querySelector('.country').dataset.country;
  console.log(countryName);
  getCountryNeighbour(countryName);
});

const getCountryData = function (country) {
  fetch(`https://restcountries.com/v3.1/name/${country}`)
    .then(response => response.json())
    .then(data => renderCountry(data[0]))
    .finally(() => (countriesContainer.style.opacity = 1));
};

const getJSON = function (url, errorMsg = 'Something went wrong!') {
  return fetch(url).then(response => {
    if (!response.ok) throw new Error(`${errorMsg} (${response.status})`);
    return response.json();
  });
};

const getCountryNeighbour = function (country) {
  // Main Country
  fetch(`https://restcountries.com/v3.1/name/${country}`)
    .then(response => {
      if (!response.ok)
        throw new Error(`Country not found (${response.status})`);
      return response.json();
    })
    .then(data => {
      renderCountry(data[0]);

      const neighbours = data[0].borders;

      if (!neighbours) throw new Error('No neighbour Found!');

      // Neighbour Country
      return Promise.allSettled(
        neighbours.map(neighbour =>
          getJSON(`https://restcountries.com/v3.1/alpha/${neighbour}`)
        )
      );
    })
    .then(data => {
      data = data
        .filter(data => data.status === 'fulfilled')
        .map(data => data.value[0]);
      data.forEach(country => renderCountry(country, 'neighbour'));
    })
    .catch(err => {
      console.error('🚫🚫🚫 Error:', err);
      renderErr(`Something Went Wrong! 🚫🚫🚫 ${err.message}. Try again!`);
    })
    .finally(() => (countriesContainer.style.opacity = 1));
};

const countriesListContainer = document.querySelector('.countries-list');
let getAllCountries = async function () {
  try {
    let res = await fetch('https://restcountries.com/v3.1/all');
    let data = await res.json();
    return data;
  } catch (err) {
    throw err;
  }
};

async function renderCountryList() {
  try {
    let countries = await getAllCountries();
    countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
    countries.forEach(country => {
      const html = `
      <li class="country-item">
        <a class="country-link" href="#" data-country-name="${country.name.common}">
          <img class="country-flag" src="${country.flags.svg}" alt="Country flag" />
          <span class="country-name">${country.name.common}</span>
        </a>
      </li>`;
      countriesListContainer.insertAdjacentHTML('beforeend', html);
    });
  } catch (err) {
    console.error(err.message);
  }
}

renderCountryList();

countriesListContainer.addEventListener('click', async function (e) {
  e.preventDefault();
  let countryName = e.target.closest('.country-link').dataset.countryName;
  let country = await getJSON(
    `https://restcountries.com/v3.1/name/${countryName}`
  );
  renderCountry(country[0]);
});
