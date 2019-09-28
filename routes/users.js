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
  router.get('/', LoginSession.isLoggedIn, function (req, res, next) {
    console.log("====================Router GET Users Router================");
    console.log("==");
    console.log("==");
    console.log("==");
    const { ckid, id, ckemail, email, ckname, name, ckTypejob, Typejob, ckRole, Role } = req.query;
    let temp = []
    const url = (req.url == '/') ? `?page=1` : req.url
    let page = req.query.page || 1;
    let limit = 2;
    let offset = (page - 1) * limit
    console.log(req.url)


    if (ckid && id) {
      temp.push(`users.userid = ${id}`)
    }

    if (ckemail && email) {
      temp.push(`users.email LIKE '%${email}%'`)
    }

    if (ckname && name) {
      temp.push(`CONCAT (users.firstname,' ',users.lastname) LIKE '%${name}%' `)
    }

    if (ckTypejob && Typejob) {
      temp.push(`users.typejob = '${Typejob}'`)
    }

    if (ckRole && Role) {
      temp.push(`users.roles = '${Role}'`)
    }

    let sql = `SELECT COUNT(*) as total FROM users`

    pool.query(sql, (err, count) => {
      const total = count.rows[0].total
      const pages = Math.ceil(total / limit)

      let sql = `SELECT * FROM users`;

      console.log('this sql ', sql);
      if (temp.length > 0) {
        sql += ` Where ${temp.join(" AND ")}`
      }

      // sql += ` LIMIT ${limit} OFFSET ${offset}`;

      pool.query(sql, (err, row) => {
        pool.query(`SELECT adminoption FROM users WHERE userid = ${req.session.user.userid}`, (err, data) => {
          res.render('users/index', {
            user: row.rows,
            query: req.query,
            isAdmin: req.session.user,
            option: data.rows[0].adminoption,
            path,
            pages: pages,
            current: page,
            url: url
          })
        });

      })
    })
  });

  //------------------------------------------------------------------------------------ 
  router.post('/option', (req, res) => {

    console.log("====================Router Post options================");
    console.log("==");
    console.log("==");
    console.log("==");

    let sql = `UPDATE users SET adminoption = '${JSON.stringify(req.body)}' WHERE userid =${req.session.user.userid} `
    console.log(sql);
    console.log(req.session.user);

    pool.query(sql, (err) => {
      if (err) throw err;

      res.redirect('/users');
    })

  })

  router.get('/addUser', LoginSession.isLoggedIn, (req, res) => {
    console.log("====================Router GET ADD================");
    console.log("==");
    console.log("==");
    console.log("==");
    let path = "user"

    res.render('users/add', {
      path,
      isAdmin: req.session.user
    });
  })

  router.post('/save', (req, res) => {
    console.log("====================Router GET ADD================");
    console.log("==");
    console.log("==");
    console.log("==");
    let path = "user"
    const { email, password, firstname, lastname, position, type } = req.body

    let sql = `INSERT INTO users (email, password, firstname, lastname, roles, typejob, isadmin)
    VALUES ('${email}', '${password}', '${firstname}', '${lastname}', '${position}', '${type}', false)`;

    console.log('this sql add users>>', sql);

    pool.query(sql, (err) => {
      res.redirect('/users')
    })
  })
  //==========================Router GET EDIT users=================\\

  router.get('/editUser/:userid', LoginSession.isLoggedIn, (req, res) => {
    console.log("====================Router GET Users Edit================");
    console.log("==");
    console.log("==");
    console.log("==");

    let sql = `SELECT * FROM users WHERE userid =${req.params.userid}`;

    pool.query(sql, (err, data) => {
      if (err) { console.error('NOT FOUND') }
      res.render('users/edit', {
        data: data.rows[0],
        path,
        isAdmin: req.session.user
      })
    })
  })

  //==========================Router post Edit=================\\
  router.post('/update/:userid', (req, res) => {
    console.log("============================Router POST EDIT====================");
    const { email, password, firstname, lastname, position } = req.body
    let type = req.body.type ? true : false;
    console.log('this req body>', req.body);



    let sql2 = `UPDATE users SET firstname='${firstname}', lastname='${lastname}', roles='${position}', typejob='${type}' WHERE userid ='${req.params.userid}' `
    
    if (password && email !== '') {
      sql2 = `UPDATE users SET email= '${email}', password ='${password}',firstname='${firstname}', lastname='${lastname}', roles='${position}', typejob='${type}' WHERE userid ='${req.params.userid}'`;
    }

    console.log(sql2);

    pool.query(sql2, (err) => {
      res.redirect('/users')

    })
  })

  // ============================= Router Delete Users ============================= 
  router.get('/deleteUser/:userid', LoginSession.isLoggedIn, (req, res) => {
    let sql = `DELETE FROM users WHERE userid = ${req.params.userid}`;
    console.log('this sql delete users', sql);
    pool.query(sql, (err) => {
      if (err) { console.error('Remove Failed') }
      res.redirect('/users')
    })
  });
  return router;
};
