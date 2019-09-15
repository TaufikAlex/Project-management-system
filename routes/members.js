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
  router.get('/:projectid', (req, res) => {
    let path = "members"
    console.log("=================Router PROJECT============");
    console.log("==");
    console.log("==");
    console.log("==");


    const { ckid, id, ckname, name, ckmember, member } = req.query;
    const url = (req.url == '/') ? `/?page=1` : req.url
    const page = req.query.page || 1;
    const limit = 3;
    const offset = (page - 1) * limit
    let params = [];

    console.log(req.query);
    console.log("");
    console.log("");

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
    console.log('this sql >', sql);
    console.log("");
    console.log("");

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
      console.log(sql);
      console.log("");
      console.log("");

      if (params.length > 0) {
        sql += ` WHERE ${params.join(" AND ")}`
      }
      sql += ` ORDER BY projects.projectid LIMIT ${limit} OFFSET ${offset}`
      let subquery = `SELECT DISTINCT projects.projectid FROM projects LEFT JOIN members ON projects.projectid = members.projectid`
      if (params.length > 0) {
        subquery += ` WHERE ${params.join(" AND ")}`
      }
      subquery += ` ORDER BY projects.projectid LIMIT ${limit} OFFSET ${offset}`
      let sqlMembers = `SELECT projects.projectid, users.userid, CONCAT (users.firstname,' ',users.lastname) AS fullname FROM projects LEFT JOIN members ON projects.projectid = members.projectid LEFT JOIN users ON users.userid = members.userid WHERE projects.projectid IN (${subquery})`

      console.log('this subquery>', subquery);
      console.log("");
      console.log("");
      console.log('this sql members>', sqlMembers);

      console.log("");
      console.log("");

      console.log(sql);

      pool.query(sql, (err, projectData) => {
        console.log(projectData);

        if (err) throw err;
        // console.log();
        
        pool.query(sqlMembers, (err, memberData) => {

          projectData.rows.map(project => {
            project.members = memberData.rows.filter(member => { return member.projectid == project.projectid }).map(data => data.fullname)
          })
          let sqlusers = `SELECT * FROM users`;
          let sqloption = `SELECT projectsoptions  FROM users  WHERE userid =${req.session.user.userid}`;
          console.log(sqloption);

          pool.query(sqlusers, (err, data) => {
            console.log('this data users >',data.rows);
            
            pool.query(sqloption, (err, options) => {
              console.log(err, options.rows);

              // console.log(typeof option.rows[0].projectoption);
              res.render('members/list', {
                data: projectData.rows,
                query: req.query,
                users: data.rows,
                current: page,
                pages: pages,
                url: url,
                path,
                option: JSON.parse(options.rows[0].projectsoptions),
                isAdmin: req.session.user,
                projectid: req.params.projectid
              })
            })
          })
        })
      })
    })
  });

  router.post('/update', (req, res) => {

    console.log("====================Router Post options================");
    console.log("==");
    console.log("==");
    console.log("==");

    let sql = `UPDATE users SET projectsoptions = '${JSON.stringify(req.body)}' WHERE userid =${req.session.user.userid} `
    console.log(sql);
    console.log(req.session.user);

    pool.query(sql, (err) => {
      if (err) throw err;

      res.redirect('/members');
    })

  })

return router;
};
