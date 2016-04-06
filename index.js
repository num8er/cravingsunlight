//sudo npm cache clean -f
//sudo npm install -g n
//sudo n stable
//fuser -n tcp -k 8888

var app = require('express')();
var express = require('express');
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(8888);
console.log('Listening on 8888');

//var fs = require("fs");
var session = require('express-session');
var cookieParser = require('cookie-parser');
var cookieSession = require('express-session');

//var url = require('url');
var request = require('request');



var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

app.use(express.static(__dirname + '/public'));
app.use(cookieParser(generateRandomString(16)));
app.use(cookieSession(
  {
    resave:true,
    saveUninitialized:true,
    secret:'secret'
  }
  ));

var latitude = 0;
var longitude = 0;

io.sockets.on('connection', function(socket) {

    socket.emit('page','name');
    socket.on('page', function (data) {
      //console.log('loaded ' + data);
      if(data=='dashboard.html'){
          socket.emit('data', sent_data);
      }
      if (data=='index.html' && latitude!=0 && longitude!=0){
        socket.emit("redirect_to_dashboard");
      }

    });
    
    socket.on('latitude',function (data){
      latitude = data.toString();
      //console.log('Client latitude: ' + latitude);
    });
    
    socket.on('longitude',function (data){
      longitude = data.toString();
      //console.log('Client longitude: ' + longitude);
      socket.emit("redirect_to_dashboard");
    });

});

var sync = require('synchronize');
var fiber = sync.fiber;
var await = sync.await;
var defer = sync.defer;
var len = 0;

var max = 5; //max number of days for forecast
var appid = "09c5c88871db88f2e5a09bcedcb60435"; //your Openweather APP ID

//Openweather API for querying weather data for a given lat and long
function getReq(lat,lon){
  var url =  "http://api.openweathermap.org/data/2.5/forecast/daily?lat="+lat+"&lon="+lon+"&cnt="+max+"&mode=json&appid="+appid;
  //console.log("URL is: " + url);
  return url;
}



function getWeather(url){
  //GET request to Open Weather API
  var current_weather = await( request.get(url, defer(), function(err, body){}));
  //console.log(current_weather.body);

  var temp = [];
  var weather_type = [];
  var weather_description = [];

  current_weather = JSON.parse(current_weather.body);
  current_weather_list = current_weather.list;
  
  for(i in current_weather_list){
    temp.push(celsius(current_weather_list[i].temp.day));
    weather_type.push(current_weather_list[i].weather[0].main);
    weather_description.push(current_weather_list[i].weather[0].description);
  }
  // console.log(temp);
  // console.log(weather_type);
  // console.log(weather_description);
}



var dashboard_data = [];
app.get('/dashboard',function(req, res) {
    //Getting rid of obsolete data in the database (if any).
    //delete_collection();
    try {
        fiber(function() {

            //console.log("Temperature at your location: ");
            getWeather(getReq(latitude,longitude));
            getList();
              //Insert into the database
              //insert(dashboard_data);
              // res.sendFile(__dirname + '/public/dashboard.html');
            });
            
        // });
      //Print Dashboard data to console
      //console.log(dashboard_data);
    }
    catch(err) {
        console.error(err);
    }

  });



function celsius(temp){
  return (temp-273.15);
}





// db.system.js.save(
//    {
//      _id : "distance" ,
//      value : function (lat1, lon1, lat2, lon2) {
//             var R = 6371; // km
//             var dLat = toRad(lat2-lat1);
//             var dLon = toRad(lon2-lon1);
//             var lat1 = toRad(lat1);
//             var lat2 = toRad(lat2);

//             var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
//               Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
//             var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
//             var d = R * c;
//             return d;
//           }
//    });



// function distance(lat1, lon1, lat2, lon2) {
//             var R = 6371; // km
//             var dLat = toRad(lat2-lat1);
//             var dLon = toRad(lon2-lon1);
//             var lat1 = toRad(lat1);
//             var lat2 = toRad(lat2);

//             var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
//               Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
//             var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
//             var d = R * c;
//             return d;
//           }

// db.system.js.save(
//    {
//      _id : "toRad" ,
//      value : function (Value){
//               return Value * Math.PI / 180;
//         }
//    });

// function toRad(Value){
//   return Value * Math.PI / 180;
// }




var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/cities';
var cities = [];
var radius = 250;

var cities_query = "{distance("+latitude+","+longitude+",this.lat,this.lon)<"+radius+"}";

// var aggregateCities = function(db, callback) {
//    db.collection('list').eval(cities_query).toArray(function(err, result) {
//      assert.equal(err, null);
//      data = result;
//      console.log(data);
//      callback(result);
//    });
// };

var aggregateCities = function(db, callback) {
   db.collection('list').eval(cities_query).toArray(function(err, result) {
     assert.equal(err, null);
     data = result;
     console.log(data);
     callback(result);
   });
};

function getList(){
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    //console.log("Connected correctly to server.");
      aggregateCities(db, function() {
        db.close();
      });
    });
}



// function insert(data){
//   MongoClient.connect(url, function(err, db) {
//     assert.equal(null, err);
//     //console.log("Connected correctly to server.");
//     var col = db.collection('BITdata');
//     col.insertMany(data, function(err, r) {
//       assert.equal(null, err);
//       //console.log("Inserted the data");

//       aggregateArtists(db, function() {
//         db.close();
//       });
//     });




