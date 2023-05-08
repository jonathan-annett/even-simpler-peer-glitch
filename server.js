/*
MIT License

Copyright (c) 2023 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


*/
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
 
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('static')); 
 
var routes = require("./routes.js")(app);

var startWss = require("./startWss.js");

process.github_rev = process.env.PARSE_GIT && require('child_process').execSync('git rev-parse HEAD').toString().trim() || '';

console.log ("Github revision hash: "+process.github_rev);

var server = app.listen(process.env.PORT||3000, function () {
  console.log("Listening on port %s", server.address().port);
});

startWss(server,app);
