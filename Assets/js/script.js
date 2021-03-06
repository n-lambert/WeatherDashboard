//Variables
const apiKey = "&appid=326fca5bba9551d71d625bf0827f48cb";
const urlBase = "https://api.openweathermap.org/data/2.5/weather?q=";
const weatherDiv = $("#current-weather");
const currentDate = moment().format("MM/DD/YYYY");
const stateAbbreviations = [
    'AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FM', 'FL', 'GA',
    'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MH', 'MD', 'MA',
    'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND',
    'MP', 'OH', 'OK', 'OR', 'PW', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT',
    'VT', 'VI', 'VA', 'WA', 'WV', 'WI', 'WY'
]; //state abbreviations provided by github.com/bubblerun
let cityForPrint;
let city;
let state;
let isHistory = false;
let mostRecentButton;
let queryURL;





//Functions

function calcTemp(tempinC) {
    const tempInFarenheight = (parseInt(tempinC) - 273.15) * 9 / 5 + 32;
    return tempInFarenheight.toFixed(1);
}

function search() {

    //set queryValue based on isHistory
    let queryValue;

    if (isHistory) {
        queryValue = mostRecentButton;
    } else {
        queryValue = $("#query").val().trim();
        $("#query").val("");
    }

    //set searchTerm
    let searchTerm = queryValue.split(",").map(item => item.trim());
    console.log('here is search term');
    console.log(searchTerm);

    //remove identical buttons
    if ($(`#${queryValue.replace(/,\s/, "").replace(/\s/, "")}`)) {
        console.log("this is query value" + queryValue);
        $(`#${queryValue.replace(/,\s/, "").replace(/\s/, "")}`).remove();
    }

    //assign city and (if state) state
    city = searchTerm[0];
    if (searchTerm[1]) {
        if (stateAbbreviations.indexOf(searchTerm[1].toUpperCase()) > -1) {
            state = "," + searchTerm[1] + ",us";
        } else {
            state = "," + searchTerm[1];
        }
    } else {
        state = null;
    }

    //append button for search results so we retain search history
    const lastRequest = $("<button class='result-history'></button>");
    lastRequest.data("location", queryValue);
    lastRequest.attr("id", queryValue.replace(/,\s/, "").replace(/\s/, ""));
    lastRequest.text(queryValue);
    $("#search-results").append(lastRequest);

    //set up queryURL
    if (state) {
        queryURL = urlBase + city + state + apiKey
    } else {
        queryURL = urlBase + city + apiKey
    }

    //ajax query
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(showResponse)
}


function showResponse(response) {
    console.log('here is response');
    console.log(response);

    //set current weather data
    weatherDiv.empty();

    const currentHeader = $("<h3>");
    const iconURL = "https://openweathermap.org/img/wn/" + response.weather[0].icon + "@2x.png";
    currentHeader.html(`${response.name} (${currentDate})<img src=${iconURL} style="width:50px"/>`);
    weatherDiv.append(currentHeader);

    const temp = calcTemp(response.main.temp);
    const tempDiv = $(`<p>Temperature: ${temp} °F</p>`)
    weatherDiv.append(tempDiv);

    const humidityDiv = $(`<p>Humidity: ${response.main.humidity}%</p>`)
    weatherDiv.append(humidityDiv);

    const windDiv = $(`<p>Wind Speed: ${response.wind.speed} MPH</p>`)
    weatherDiv.append(windDiv);

    //find uv index
    let uv;
    const uvURL = `https://api.openweathermap.org/data/2.5/uvi?lat=${response.coord.lat}&lon=${response.coord.lon}&appid=4e5d3cc57c8eb2f1baa615bd2033d24d`
    $.ajax({
        url: uvURL,
        method: "GET"
    }).then(getUV);

    //set up 5 day forecast
    const forecastURL = "https://api.openweathermap.org/data/2.5/forecast?id=" + response.id + apiKey;
    $.ajax({
        url: forecastURL,
        method: "GET"
    }).then(getForecast);
}

//look for UV value once initial weather response is returned
function getUV(response) {
    console.log(response);
    uv = response.value;
    const uvDiv = $(`<p>UV Index: <span id="uv">${uv}</span></p>`);
    weatherDiv.append(uvDiv);

    //set color based on UV chart
    if (parseInt(uv) < 3) {
        $("#uv").css("background-color", "green");
    } else if (parseInt(uv) < 6) {
        $("#uv").css("background-color", "yellow");
    } else if (parseInt(uv) < 8) {
        $("#uv").css("background-color", "orange");
    } else if (parseInt(uv) < 11) {
        $("#uv").css("background-color", "red");
    } else {
        $("#uv").css("background-color", "violet");
    }


}


//look for 5 day forecast once initial weather response returns
function getForecast(response) {
    console.log(response);
    const forecastDiv = $("#forecast");
    forecastDiv.empty();

    //populate 5 days out
    let index = 4;
    for (let i = 0; i < 5; i++) {
        const oneDay = $("<div class='day'></div>");

        const dateIconDiv = $("<div class='one-day'>");
        const date = moment().add(i + 1, "days").format("MM/DD/YYYY");
        const title = $(`<h5>${date}</h5>`)
        dateIconDiv.append(title);

        const iconURL = "https://openweathermap.org/img/wn/" + response.list[index].weather[0].icon.replace("n", "d") + "@2x.png";
        const iconImg = $(`<img src=${iconURL} style="width:1en"/>`);
        dateIconDiv.append(iconImg);
        oneDay.append(dateIconDiv);

        const resultsEl = $("<div>");
        const temp = calcTemp(response.list[index].main.temp);
        const tempDiv = $("<p class='one-day'></p>");
        tempDiv.html(`Temp: ${temp} °F`);
        resultsEl.append(tempDiv);

        const humidityEl = $("<p class='one-day'></p>");
        humidityEl.html(`Humidity: ${response.list[index].main.humidity}%`);
        resultsEl.append(humidityEl);
        oneDay.append(resultsEl);

        //append finished day to forecast        
        forecastDiv.append(oneDay);
        index += 8;
    }
}


//set click even on search submit button
$("#submit").on("click", function(element) {
    element.preventDefault();
    isHistory = false;
    search();
});


//set click event on result-history buttons
$(document).on('click', '.result-history', function(element) {
    element.preventDefault();
    isHistory = true;
    mostRecentButton = $(this).data("location");
    search();
});