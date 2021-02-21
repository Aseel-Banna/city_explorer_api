'use strict';

let weatherArray = [];
let locationArray = [];

const express = require ('express');
require('dotenv').config();

const cors = require('cors');

const server = express();
server.use(cors()); 

const PORT = process.env.PORT || 3030;

server.get('/',(req,res)=>{
    res.send('Home Route');
});

server.get('/test',(req,res)=>{
    res.send('Your server is working fine!!')
})

server.get('/location',(req,res)=>{
    const locData = require('./data/location.json');
    console.log(locData);
    const locObj = new Location(locData);
    console.log(locObj);
    res.send(locObj);
    
})

server.get('/weather',(req,res)=>{
    const weatherData = require('./data/weather.json');
    const weather = []
    weatherData.data.forEach(e=>{
        const locObj = new Weather(e);
        console.log(weatherData);
        weather.push(locObj)        
    })   
    res.send(weather);    
})



function handleErrors(){
server.use('*',(req,res)=>{
    res.status(500).send('Sorry, something went wrong')
})
}

handleErrors();

function Location (geoData) {
    this.search_query = 'Lynnwood';
    this.formatted_query= geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;

    locationArray.push(this);
}


function Weather (weatherData) {
    this.weather = weatherData.weather.description;
    this.time= weatherData.datetime;
}

server.listen(PORT, ()=>{
    console.log(`Listening on PORT ${PORT}`);
})
