var express = require('express');
var router = express.Router();
var moment = require('moment');
const bodyParser = require('body-parser');
moment().format();

//------BODY PARSER-----------\\
// parse application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
router.use(bodyParser.json())
//----------END BP----------\\

module.exports = (pool) => {

  /* GET home page. */
  router.get('/', function (req, res, next) {
    res.render('index', {  });


  });
  return router;

};

