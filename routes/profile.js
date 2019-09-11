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

module.exports = (pool) => {

  /* GET home page. */
  router.get('/',LoginSession.isLoggedIn, function (req, res, next) {
    
    console.log("============================Router Index Login====================");

    // res.render('projects/profile', {
    //     title: 'login',
    //     user: req.session.user,
    //     loginInfo: req.flash('loginInfo')[0]
    //     // loginMessage: req.flash('loginMessage')
    // }); 
    res.render('projects/profile', {  });


  });
  return router;

};

