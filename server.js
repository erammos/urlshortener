'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var urlParser = require('url');
var cors = require('cors');
const dns = require('dns');
var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
// mongoose.connect(process.env.DB_URI);
console.log(process.env.LS_COLORS)
mongoose.connect(process.env['DB_URI'], { useNewUrlParser: true, useUnifiedTopology: true }, (e) => {
  console.log(e);
});

const urlSchema = new mongoose.Schema({
  url: { type: String, required: true },
  hash: { type: Number, required: true }
});
const urlModel = mongoose.model("url", urlSchema);

app.use(cors());
/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

function hash(str) {
  var hash = 5381,
    i = str.length;

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }
  return hash >>> 0;
}

// your first API endpoint... 
app.post("/api/shorturl/new", (req, res) => {
  const uri = req.body['url'];
  const hashVar = hash(uri);
  urlModel.findOne({ hash: hashVar }, (err, data) => {
    if (data != null) {
      console.log("foundAlready" + data);
      res.json({ original_url: data['url'], short_url: data['hash'] });
    }
    else {
      dns.lookup(urlParser.parse(uri).host, (err, addr) => {
        if (err != null) {
          const urlInstance = new urlModel({ url: uri, hash: hashVar })
          urlInstance.save((err, data) => {
            res.json({ original_url: data['url'], short_url: data['hash'] });
          })
        }
        else {
          res.json({ "error": "invalid URL" });
        }
      })
    }
  });
});

app.get("/api/shorturl/:hash", (req, res) => {
  const hashVar = req.params["hash"];
  urlModel.findOne({ hash: hashVar }, (err, data) => {
    if (data != null) {
      res.redirect(data['url']);
    }
    else {
      res.json({ "error": "invalid URL" });
    }
  });
});
app.listen(port, function () {
  console.log(`Node.js listening ... ${port}`);
});