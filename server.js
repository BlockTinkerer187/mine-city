const express = require("express");
const app = express();
const nodemailer = require('nodemailer');
const fs = require("fs")

const router_rules = require(__dirname + "/routes/rules.js")
//const mail_html = fs.readFileSync(__dirname + "/mail_html.html")

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAILER_EMAIL,
    pass: process.env.MAILER_PASSWORD
  }
});


function mail(from, message) {
var mailOptions = {
  from: 'Survival City Mailer',
  to: process.env.RECIPIENT_EMAIL,
  subject: 'Admin Notification',
  html: "h"
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
};


function getFilesInDirectory(dir) {
  return [].concat(...fs.readdirSync(dir).map(name => {
    const path = dir + '/' + name;
    const stats = fs.statSync(path);
    if (stats.isDirectory()) {
      return getFilesInDirectory(path);
    } else if (stats.isFile()) {
      return [path];
    } 
    return [];
  }));
}


function checkHttps(req, res, next){
  // protocol check, if http, redirect to http
  console.log("have request")
  if(req.get('X-Forwarded-Proto').indexOf("https")!=-1){
    //console.log("https, yo")
    return next()
  } else {
    //console.log("just http")
    res.redirect('https://' + req.hostname + req.url);
  }
}

app.all('*', checkHttps)


// Configure Express
app.set('view engine', 'pug')
app.use(express.static("public"));
app.use('/rules', router_rules)

// Start Routing
app.get("/", (request, response) => {
  response.render(__dirname + "/views/index.pug");
});

app.get("/md", function (request, response) {
  response.header("Cache-Control", "max-age=0");
  const files = {};
  getFilesInDirectory('md').sort().forEach(path => {
    const fileName = path.replace(/md\/(.*)\.md/, '$1'); //trim off "md/" and ".md"
    files[fileName] = fs.readFileSync(path, 'utf8');
  });
  response.send(files);
});

app.get("/offline", function (request, response) {
  response.sendFile(__dirname + '/views/offline.html');
});

app.get("/manifest.json", function (request, response) {
  response.sendFile(__dirname + '/views/manifest.json');
});

app.get("/offenses", (req, res) => { res.render("offenses") })

app.get("/report", (req, res) => { res.render("report")})

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
