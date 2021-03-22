var createError = require('http-errors');
var express = require('express');
//var path = require('path');
var cookieParser = require('cookie-parser');
const axios = require('axios');

var app = express();

//const index = require('./routes/index');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(index);

app.get('/', (req, res) => {
    res.send('Hello World!')
  });


//const fs = require('fs');
//const isConnected = require('./isConnected');


const ldConfig ={
    headers: {
        'Content-Type': 'ld+json'
    }
}

app.get('/api/article', (req, res) => {
    axios.get('http://localhost:8082/api/articles/' + req.query.idArticle).then(res_http => {

        const apiArticle = res_http.data;
        console.log(apiArticle);

        delete apiArticle['@context'];
        delete apiArticle['@id'];
        delete apiArticle['@type'];

        apiArticle['Tag'] = apiArticle['Tag'].map(t=>t.split('tags/')[1]);

        //if (req.user.role === "admin" || apiArticle.user['@id'] === req.user['@id'] || !apiArticle['draft']) {
          //  apiArticle.isEditable = req.user.role === "admin" || apiArticle.user['@id'] === req.user['@id'];
            res.status(200).json(apiArticle);
        //} else {
          //  res.status(200).json({'status': 4});
        //}

    }).catch((error) => {

        res.status(200).json({'status': 5});

    })
})


app.get('/api/tags', (req, res) => {

    axios.get('http://localhost:8082/api/tags').then(res_http => {


        const apiTag = res_http.data['hydra:member'];
        apiTag.forEach(element => {
            delete element['@id'];
        delete element['@type'];
        });
        
        console.log(apiTag);

        res.status(200).json(apiTag);

    }).catch(error => {
        res.status(200).json({'status':1});

    })
})

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`)
  })
  



//module.exports = app;
