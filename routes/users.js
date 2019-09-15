var express = require('express');
var router = express.Router();
var moment = require('moment');
const bodyParser = require('body-parser');
const LoginSession = require('../auth/auth');

moment().format();

//------BODY PARSER-----------\\
// parse application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
router.use(bodyParser.json())

//----------END BP----------\\

/* GET users listing. */


module.exports = (pool) => {
  
  var path = "users";
  router.get('/', function (req, res, next) {

    res.render('users/index',{path});
  });


return router;
};
