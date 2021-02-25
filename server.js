'use strict';
require('dotenv').config();

let locationArray = [];

const express = require ('express');
const cors = require('cors');
const superagent = require('superagent');

// Database 
const pg =require('pg');



const PORT = process.env.PORT || 3030;
const server = express();
server.use(cors()); 
const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });
// const client = new pg.Client(process.env.DATABASE_URL);

// Server tests and handlers
server.get('/', homeHandler);
server.get('/test', testHandler);
server.get('/location',check);
server.get('/weather', weatherHandler);
server.get('/parks', parksHandler);
server.get('/movies', moviesHandler);
server.get('/yelp', yelpHandler);
server.get('/*', errorHandler);

// Handler Functions
function check(req,res){
    const cityName = req.query.city;
    let key = process.env.GEOCODE_API_KEY;
    let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
    let SQL = `SELECT * FROM locations WHERE search_query = '${cityName}';`;
    client.query(SQL)
    .then(results =>{
        console.log(results.rows)
        if (results.rows.length === 0){
            superagent.get(url)
            .then(locData =>{
            SQL = `INSERT INTO locations VALUES ($1,$2, $3, $4) RETURNING *;`;
            const locationData = new Location(cityName, locData.body[0]);
            let safeValues = [cityName,locationData.formatted_query, locationData.latitude, locationData.longitude];
            client.query(SQL,safeValues)
            .then((result)=>{
            res.send(result.rows[0]);
        })
        .catch(()=>{
            errorHandler('Error in getting data from DATABASE');
        });
    
})

        }else{
            SQL = `SELECT * FROM locations WHERE search_query = '${cityName}';`;
            client.query(SQL)
            .then(results =>{
                // console.log(results);
                res.send(results.rows[0]);
            })
            .catch((error)=>{
                res.send('pppppppppppp',error.message)
            })
                }
            })
}
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

function moviesHandler(req, res){
    let city = req.query.search_query;
    let key = process.env.MOVIE_API_KEY;
    let url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${city}`
    return superagent.get(url)
    .then(movieData =>{
        // console.log('movie DATA', movieData);
       let moviesArray =  movieData.body.results.map((item, i)=>{
        return new Movies(item);
     })
     res.send(moviesArray);
     })
 
     .catch(()=>{
         errorHandler('Error in getting data from LocationIQ')
     })
}

function yelpHandler(req,res){ 
    let lat = req.query.latitude;
    let lon = req.query.longitude;
    let page = req.query.page;
    let city = req.query.search_query;
    let offset = (page - 1) * 5;
    let key = process.env.YELP_API_KEY;
    let url = `https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=${lat}&longitude=${lon}&limit=5&offset=${offset}`;
    return superagent.get(url)
    .set("Authorization", `Bearer ${key}`)
      .then((yelpData) => {
        let yelpArray= yelpData.body.businesses.map((e) => {
          return new Yelp(e);
        });
        console.log("YELP DATA", yelpArray);
        res.send(yelpArray);
      })
      .catch((error) => {
        console.log(error);
      });
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

function Movies (data){
    this.title = data.title;
    this.overview = data.overview;
    this.average_votes = data.vote_average;
    this.total_votes = data.vote_count;
    this.image_url = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
    this.popularity = data.popularity;
    this.released_on = data.release_date;
}

function Yelp (data){
    this.name = data.name;
    this.image_url = data.image_url;
    this.price = data.price;
    this.rating = data.rating;
    this.url = data.url;
}

client.connect()
    .then(server.listen(PORT, () => {
        console.log(`Listening to port number ${PORT}`);
    })
    )