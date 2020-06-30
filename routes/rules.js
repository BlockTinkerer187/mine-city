var express = require('express')
var router = express.Router()
const fs = require("fs")
const path = require("path")


//[[ FUNCTIONS ]]\\
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


//[[ ROUTER ROUTES ]]\\
router.get("/md", function (request, response) {
  response.header("Cache-Control", "max-age=0");
  const files = {};
  getFilesInDirectory('md').sort().forEach(path => {
    const fileName = path.replace(/md\/(.*)\.md/, '$1'); //trim off "md/" and ".md"
    files[fileName] = fs.readFileSync(path, 'utf8');
  });
  response.send(files);
});



// define the home page route
router.get('/', function (req, res) {
  var newpath = path.resolve(__dirname + "/../views/rules.pug")
  res.render(newpath)
})


// define the about route
router.get('/about', function (req, res) {
  res.send('About birds')
})

module.exports = router