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
  
 
  //==========Router Get Overview=========\\
  // router.get('/projects/:projectid',LoginSession.isLoggedIn, (req, res) => {
  //   let path = "members"
  //   console.log("=================Router Members============");
  //   console.log("==");
  //   console.log("==");
  //   console.log("==");


  //   const { ckid, memberid, ckname, name, ckposition, position } = req.query;
  //   let temp = []
  //   const pathside = "member";
  //   console.log(req.url)
  //   const url = (req.url == `/members/${req.params.projectid}`) ? `/members/${req.params.projectid}/?page=1` : req.url
  //   let page = req.query.page || 1;
  //   let limit = 2;
  //   let offset = (page - 1) * limit

  //   if (ckid && memberid) {
  //     temp.push(`members.membersid = ${memberid}`)
  //   }

  //   if (ckname && name) {
  //     temp.push(`fullname = ${name}`)
  //   }

  //   if (ckposition && position) {
  //     temp.push(`members.roles = "${position}"`)
  //   }
  //   let sql = `SELECT count(*) as total FROM members WHERE members.projectid = ${req.params.projectid}`;
  //   // if (temp.length > 0) {
  //   //   sql += ` WHERE ${temp.join(" AND ")}`
  //   // }
  //   pool.query(sql, (err, count) => {
  //     const total = count.rows[0].total
  //     const pages = Math.ceil(total / limit)
  //     let sqlmember = `SELECT projects.projectid, members.membersid, members.roles, CONCAT (users.firstname,' ',users.lastname) AS fullname FROM members LEFT JOIN projects ON projects.projectid = members.projectid LEFT JOIN users ON users.userid = members.userid WHERE members.projectid = ${req.params.projectid}`;
  //     if (temp.length > 0) {
  //       sqlmember += ` AND ${temp.join(" AND ")}`
  //     }
  //     sqlmember += ` ORDER BY members.projectid LIMIT ${limit} OFFSET ${offset}`
      

  //     console.log('this sql member>',sqlmember);

  //     let sqloption = `SELECT memberoption  FROM users  WHERE userid = ${req.session.user.userid}`;

  //     pool.query(sqlmember, (err, data) => {
  //       pool.query(sqloption, (err, option) => {
  //         res.render('members/list', {
  //           data: data.rows,
  //           projectid: req.params.projectid,
  //           current: page,
  //           pages: pages,
  //           url: url,
  //           fullname: data.fullname,
  //           option: option.rows[0].memberoption,
  //           pathside, path,
  //           isAdmin: req.session.user,
  //           query: req.query
  //         })
  //       })
  //     });
  //   })
  // });

  // router.post('/update/:projectid', (req, res) => {
  //   projectid = req.params.projectid;

  //   console.log("====================Router Post options================");
  //   console.log("==");
  //   console.log("==");
  //   console.log("==");

  //   let sql = `UPDATE users SET projectsoptions = '${JSON.stringify(req.body)}' WHERE userid =${req.session.user.userid} `
  //   console.log(sql);
  //   console.log(req.session.user);

  //   pool.query(sql, (err) => {
  //     if (err) throw err;

  //     res.redirect(`'/members/${projectid}'`);
  //   })

  // })

return router;
};
