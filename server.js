'use strict';

let locationArray = [];

const express = require ('express');
const cors = require('cors');
const server = express();
const superagent = require('superagent');

require('dotenv').config();
server.use(cors()); 

const PORT = process.env.PORT || 3030;

// Server tests and handlers
server.get('/', homeHandler);
server.get('/test', testHandler);
server.get('/location',locationHandler);
server.get('/weather', weatherHandler);
server.get('/parks', parksHandler);
server.get('/*', errorHandler);



// Handler Functions
function weatherHandler(req,res){
    const cityName = req.query.search_query;
    let key = process.env.WEATHER_API_KEY;
    let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${key}&days=5`;
    superagent.get(url)
    .then(weatherData =>{
         let weatherArray = weatherData.body.data.map((item)=>{
        return new Weather(item);
     })
     console.log(weatherArray);
     res.send(weatherArray);
     })
 
     .catch(()=>{
         errorHandler('Error in getting data from LocationIQ')
     })

}

function parksHandler(req,res){
    let city = req.query.search_query;
    let key = process.env.PARKS_API_KEY;
    let url = `https://developer.nps.gov/api/v1/parks?q=${city}&api_key=${key}`;

    superagent.get(url)
   .then(parkData =>{
      let parkArray =  parkData.body.data.map((item, i)=>{
       return new Parks(item);
    })
    res.send(parkArray);
    })

    .catch(()=>{
        errorHandler('Error in getting data from LocationIQ')
    })
   
}

function  locationHandler (req, res)  {
   console.log(req.query);
   const cityName = req.query.city;
   console.log(cityName);
   let key = process.env.GEOCODE_API_KEY;
   let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
   console.log('before superagent')
   superagent.get(url)
   .then(locData =>{
       console.log('inside superagent')
       const locationData = new Location(cityName, locData.body[0]);
       res.send(locationData);
   })
   .catch(()=>{
       errorHandler('Error in getting data from LocationIQ');
   })
}

function testHandler(req,res){
    res.send('Your server is working fine!!');
}

function homeHandler(req,res){
    res.send('Home Route');
}

function errorHandler(errors) {
    server.use('*',(req,res)=>{
        res.status(500).send(errors);
    })
}


function Location (city, geoData) {
    this.search_query = city;
    this.formatted_query= geoData.display_name;
    this.latitude = geoData.lat;
    this.longitude = geoData.lon;

    locationArray.push(this);
}


function Weather ( weatherData) {
    this.forecast = weatherData.weather.description;
    this.time= weatherData.datetime;
}

function Parks (park){
    this.name = park.fullName;
    this.address = `${park.addresses[0].line1} ${park.addresses[0].city} ${park.addresses[0].stateCode} ${park.addresses[0].postalCode}`;
    this.fee = park.entranceFees[0].cost || '0.00';
    this.description = park.description;
    this.url = park.url;
}

server.listen(PORT, ()=>{
    console.log(`Listening on PORT ${PORT}`);
})