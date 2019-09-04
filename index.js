// IMPLEMENT CASHING WITH NODE.JS AND REDIS
// npm init
// sudo npm i --save express node-fetch redis
// npm i -D nodemon
// include start script in package.json file to run nodemon
// npm start

// including required modules
const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

// initializing express instance
const app = express();

// defining PORTS
const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

// creating redis client to interact with node app
const client = redis.createClient(REDIS_PORT);

// Set response
function setResponse(username, repos)
{
    return `<h2>${username} has ${repos} GitHub repos</h2>`;
}

// Make request to Github for data
// Function to get number of repos from github link
async function getRepos (req, res, next) {
    try {
        
        console.log('Fetching Data');
        
        // destructing assigment to pull params out
        const { username } = req.params; 
        
        // fetching data from github link
        const response = await fetch(`https://api.github.com/users/${username}`);

        // getting response in json
        const data = await response.json();
        
        // variable to get public_repos from data object
        const repos = data.public_repos;

        // set data to redis
        client.setex(username, 3600, repos); // setex can set expiration to cached data
        
        // sending a response
        res.send(setResponse(username, repos));

    } catch (err) {
        
        console.error(err);
        res.status(500);
   
    }
}

// Cache Middleware
// function to send a response based on collected repos
function cache(req, res, next) {

    const { username } = req.params;

    client.get(username, (err, data) => {
        if (err) throw err;
        if (data != null) res.send(setResponse(username, data));
        else next();
    })
}

// to use cache middleware we simply pass it as paramater
// route
app.get('/repos/:username', cache, getRepos);

// use localhost:5000 to run the app
app.listen(5000, () => {
    console.log(`App listening on PORT ${PORT}`);
})


