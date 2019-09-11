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



  // ---------------------------- function filter ----------------------------
  // ============================= Router Home Redirect Project =============================
  router.get('/', LoginSession.isLoggedIn, function (req, res, next) {
    console.log("=================Router PROJECT============");
    const { ckid, id, ckname, name, ckmember, member } = req.query;
    const url = (req.url == '/') ? `/?page=1` : req.url
    const page = req.query.page || 1;
    const limit = 3;
    const offset = (page - 1) * limit
    let params = [];

    if (ckid && id) {
      params.push(`projects.projectid = ${id}`);
    }
    if (ckname && name) {
      params.push(`projects.name = '${name}'`)
    }
    if (ckmember && member) {
      params.push(`members.userid = ${member}`)
    }
    // console.log(member);

    let sql = `SELECT COUNT(id) as total FROM (SELECT DISTINCT projects.projectid AS id FROM projects LEFT JOIN members ON projects.projectid = members.projectid`;
    if (params.length > 0) {
      sql += ` WHERE ${params.join(" AND ")}`
    }
    sql += `) AS projectmember`;
    // console.log(params);

    pool.query(sql, (err, count) => {
      // console.log(count.rows[0]);

      const total = count.rows[0].total;
      const pages = Math.ceil(total / limit)

      sql = `SELECT DISTINCT projects.projectid, projects.name FROM projects LEFT JOIN members ON projects.projectid = members.projectid`
      if (params.length > 0) {
        sql += ` WHERE ${params.join(" AND ")}`
      }
      sql += ` ORDER BY projects.projectid LIMIT ${limit} OFFSET ${offset}`
      let subquery = `SELECT DISTINCT projects.projectid FROM projects LEFT JOIN members ON projects.projectid = members.projectid`
      subquery += ` ORDER BY projects.projectid LIMIT ${limit} OFFSET ${offset}`
      let sqlMembers = `SELECT projects.projectid, users.userid, CONCAT (users.firstname,' ',users.lastname) AS fullname FROM projects LEFT JOIN members ON projects.projectid = members.projectid LEFT JOIN users ON users.userid = members.userid WHERE projects.projectid IN (${subquery})`

      // console.log(sql,sqlMembers);

      pool.query(sql, (err, projectData) => {
        if (err) throw err;

        pool.query(sqlMembers, (err, memberData) => {

          projectData.rows.map(project => {
            project.members = memberData.rows.filter(member => { return member.projectid == project.projectid }).map(data => data.fullname)
          })
          let sqlusers = `SELECT * FROM users`;
          let sqloption = `SELECT projectsoptions  FROM users  WHERE userid = ${req.session.user.userid}`;
          console.log(sqloption);

          pool.query(sqlusers, (err, data) => {
            pool.query(sqloption, (err, options) => {
              console.log(err ,options.rows);

              // console.log(typeof option.rows[0].projectoption);
              res.render('projects/index', {
                data: projectData.rows,
                datauser: data.rows,
                query: req.query,
                users: data.rows,
                // current: page,
                pages: pages,
                url: url,
                option: JSON.parse(options.rows[0].projectsoptions)

              })
            })
          })
        })
      })
    })
  });
  //------------------------------------------------------------------------------------ 
  router.post('/update', (req, res) => {

    console.log("====================Router Post Update================");
    console.log("");
    console.log("");
    console.log("");

    let sql = `UPDATE users SET projectsoptions='${JSON.stringify(req.body)}' WHERE userid =${req.session.user.userid} `
    console.log(sql);
    console.log(req.session.user);

    pool.query(sql, (err) => {
      if (err) throw err;

      res.redirect('/projects');
    })

  })

  //=========Router GET ADD=============\\
  console.log("============================Router Get ADD========================");

  router.get('/add', (req, row) => row.render('projects/add'))

  //=============Router POST ADD===========\\
  router.post('/add', (req, res) => {
    console.log("============================Router Post ADD========================");
    console.log("");
    console.log("");
    console.log("");
    console.log("");

    const sqladd = `INSERT INTO projects ("name") VALUES ('${req.body.name}')`;
    pool.query(sqladd, (err) => {
      if (err) throw err;

      console.log('Susccess add Projects');
      res.redirect('/projects', { data: projectData.rows[0] })

    })
  })

  //=============Router GET Edit============\\
  router.get('/edit/:id', (req, res) => {
    console.log('=====================Router Edit Get=============================');
    console.log("");
    console.log("");
    console.log("");

    let edit = parseInt(req.params.id);
    let sql = `SELECT * FROM projects WHERE projectid=$1`;
    console.log(sql);
    pool.query(sql, [edit], (err, data) => {
      if (err) throw err;

      console.log('suksess edit');
      res.render('projects/edit', { item: data.rows[0], moment })

    })
  })

  //=========Router POST Edit===========\\
  router.post('/edit/:projectid', (req, res) => {
    // let id = parseInt(req.params.id);
    console.log('=====================Router Edit POST=============================');
    console.log("");
    console.log("");
    console.log("");

    let sql = `UPDATE projects SET name= '${req.body.name}' WHERE projectid=${req.params.projectid}`;
    console.log(sql);

    pool.query(sql, (err, row) => {
      if (err) throw err;

      console.log('Done Update');

      res.redirect('/projects')
    })
  })

  //===========Router GET Deleted==========\\
  router.get('/deleted/:projectid', (req, res) => {
    console.log('=====================Router Deleted=============================');
    console.log("");
    console.log("");
    console.log("");

    let deleted = parseInt(req.params.projectid)
    let sql = `DELETE FROM projects WHERE projectid=$1`;
    console.log(sql);
    pool.query(sql, [deleted], (err) => {
      if (err) throw err;


      console.log('suksess deleted');
      res.redirect('/projects');
    })

  })



  //==========Router Get Profile=========\\
  router.get('/profile', (req, res) => {

    console.log('=====================Router Profile=============================');
    console.log("");
    console.log("");
    console.log("");

    res.redirect('/profile');
  })

  return router;

};