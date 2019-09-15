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
  router.get('/', LoginSession.isLoggedIn, (req, res) => {
    console.log("============================Router GET profile====================");
    let sql = `SELECT * FROM users where userid = ${req.session.user.userid}`;
    console.log('this sql get>', sql);
    var path = "profiles";

    pool.query(sql, (err, row, user) => {
      if (err) { console.log("error", err) }
      let Data = row.rows[0]

      res.render('profiles/profile', {
        data: req.session.user,
        Data,
        path,
        isAdmin: req.session.user
      })
    })
  });

  //==========================Router post Profiles=================\\
  router.post('/update', (req, res) => {
    console.log("============================Router POST profile====================");
    let password = req.body.password;
    let position = req.body.role;
    let job = req.body.typejob ? true : false;
    console.log('this req body>', req.body);

    let sql2 = `UPDATE users SET password ='${password}', roles='${position}', typejob='${job}' WHERE userid ='${req.session.user.userid}' `
    console.log(sql2);
        
    if (password.trim() == '') {
      sql2 = `UPDATE users set roles='${position}', typejob='${job}' WHERE userid ='${req.session.user.userid}'`;
    }
    console.log(sql2);
    
    pool.query(sql2, (err, processData) => {
      console.log(processData.rows);

      res.redirect('/profiles')

    })
    

  })
  return router;

};

