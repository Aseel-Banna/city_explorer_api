'use strict';

let locationArray = [];
require('dotenv').config();

const express = require ('express');
const cors = require('cors');
const server = express();
const superagent = require('superagent');

// Database 
const pg =require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
// const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });


server.use(cors()); 

const PORT = process.env.PORT || 3030;

// Server tests and handlers
server.get('/', homeHandler);
server.get('/test', testHandler);
server.get('/location',check);
server.get('/weather', weatherHandler);
server.get('/parks', parksHandler);
server.get('/*', errorHandler);

// server.get('/addLocation',addLocation);

// Handler Functions
let SQL;

function check(req,res){
    const cityName = req.query.city;
    let key = process.env.GEOCODE_API_KEY;
    let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
    SQL = `SELECT * FROM locations WHERE search_query = ${cityName};`;
    client.query(SQL)
    .then(results =>{
        if (results.rows.length === 0){
            superagent.get(url)
            .then(locData =>{
            SQL = `INSERT INTO locations VALUES ($1,$2, $3, $4) RETURNING *;`;
            const locationData = new Location(cityName, locData.body[0]);
            let safeValues = [cityName,locationData.formatted_query, locationData.latitude, locationData.longitude];
            client.query(SQL,safeValues)
            .then((result)=>{
            res.send(result.rows);
        })
        .catch(()=>{
            errorHandler('Error in getting data from DATABASE');
        });
    
})

        }else{
            SQL = `SELECT * FROM locations;`;
            client.query(SQL)
            .then(results =>{
                console.log(results);
                res.send(results.rows);
            })
            .catch((error)=>{
                res.send('pppppppppppp',error.message)
            })
                }
            })
}

// function renderData(req, res){
//     let SQL = `SELECT * FROM locations;`;
//     client.query(SQL)
//     .then(results =>{
//         console.log(results);
//         res.send(results.rows);
//     })
//     .catch((error)=>{
//         res.send('pppppppppppp',error.message)
//     })
// }

// function addLocation(req,res){
//     // const cityName = req.query.city;
//     // console.log(cityName);
//     let key = process.env.GEOCODE_API_KEY;
//     let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
//     superagent.get(url)
//    .then(locData =>{
//        let SQL = `INSERT INTO locations VALUES ($1,$2, $3, $4) RETURNING *;`;
//        const locationData = new Location(cityName, locData.body[0]);
//        let safeValues = [cityName,locData.body[0].formatted_query, locData.body[0].latitude, locData.body[0].longitude];
//        client.query(SQL,safeValues)
//        .then((result)=>{
//        res.send(result.rows);
//    })
//    .catch(()=>{
//        errorHandler('Error in getting data from DATABASE');
//    });
    
// })
// }



// function checkData(req,res){
//     client.query(SQL)
//     .then(results =>{
//         if (results.rows.length !== 0){
//             getData(req,res);
//         }else{
//             sendData(req,res);
//         }
//     })
//     .catch(()=>{
//         errorHandler('Error in getting DATA!!');
//     })
// }

// function getData(req,res){
//     SQL = `SELECT * FROM people;`;
//     client.query(SQL)
//     .then(results =>{
//         console.log(results);
//         res.send(results.rows);
//     })
//     .catch(()=>{
//         errorHandler('Error in getting data from LocationIQ')
//     })
// }

// function sendData(req,res){
//     SQL = `INSERT INTO people VALUES ($1,$2, $3, $4) RETURNING *;`;
//     let search_query = req.query.search_query;
//     let formatted_query = req.query.formatted_query;
//     let latitude = req.query.latitude;
//     let longitude = req.query.longitude;
//     let safeValues = [search_query,formatted_query, latitude, longitude];
//     client.query(SQL,safeValues)
//     .then((result)=>{
//         res.send(result.rows);
//         // res.send('data has been inserted!!');
//     })
//     .catch((error)=>{
//         errorHandler('Error in getting data from LocationIQ');
//         })
// }


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
     checkDataBase();
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

// function  locationHandler (req, res)  {
// //    console.log(req.query);
//    const cityName = req.query.city;
//    console.log(cityName);
//    let key = process.env.GEOCODE_API_KEY;
//    let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
//    superagent.get(url)
//    .then(locData =>{
//        const locationData = new Location(cityName, locData.body[0]);
//        res.send(locationData);
//    })
//    .catch(()=>{
//        errorHandler('Error in getting data from LocationIQ');
//    })
// }

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
    this.formatted_query= geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;

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

client.connect()
    .then(server.listen(PORT, () => {
        console.log(`Listening to port number ${PORT}`);
    })
    )