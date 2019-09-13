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
    console.log('this sql >',sql);
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
      subquery += ` ORDER BY projects.projectid LIMIT ${limit} OFFSET ${offset}`
      let sqlMembers = `SELECT projects.projectid, users.userid, CONCAT (users.firstname,' ',users.lastname) AS fullname FROM projects LEFT JOIN members ON projects.projectid = members.projectid LEFT JOIN users ON users.userid = members.userid WHERE projects.projectid IN (${subquery})`

      console.log('this subquery>',subquery);
      console.log("");
      console.log("");
      console.log('this sql members>',sqlMembers);

      console.log("");
      console.log("");
      
      
      
      
      // console.log(sql,sqlMembers);

      pool.query(sql, (err, projectData) => {
        console.log(projectData);
        
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
              console.log(err, options.rows);

              // console.log(typeof option.rows[0].projectoption);
              res.render('projects/index', {
                data: projectData.rows,
                datauser: data.rows,
                query: req.query,
                users: data.rows,
                current: page,
                pages: pages,
                url: url,
                option: JSON.parse(options.rows[0].projectsoptions),
                isAdmin: req.session.user
              })
            })
          })
        })
      })
    })
  });
  //------------------------------------------------------------------------------------ 
  router.post('/update', (req, res) => {

    console.log("====================Router Post options================");
    console.log("==");
    console.log("==");
    console.log("==");

    let sql = `UPDATE users SET projectsoptions='${JSON.stringify(req.body)}' WHERE userid =${req.session.user.userid} `
    console.log(sql);
    console.log(req.session.user);

    pool.query(sql, (err) => {
      if (err) throw err;

      res.redirect('/projects');
    })

  })
  //=============Router POST ADD===========\\
  router.get('/add', LoginSession.isLoggedIn, (req, res) => {
    console.log("============================Router Get ADD========================");
    console.log("==");
    console.log("==");
    console.log("==");
    console.log("==");
    let sql = `select * from users`;
    pool.query(sql, (err, row) => {
      console.log(sql);
      if (err) throw err;

      console.log('Susccess add Projects');
      res.render('projects/add', { data: row.rows, isAdmin: req.session.user, })
    })
  })
  // ============================= Router ADD Post Project =============================
  router.post('/add', LoginSession.isLoggedIn, (req, res) => {
    console.log("============================Router Post ADD========================");
    console.log("==");
    console.log("==");
    console.log("==");
    console.log("==")

    let sql = `INSERT INTO projects (name) values ('${req.body.name}');`
    console.log(sql);

    pool.query(sql, (err) => {
      if (err) { console.log('error') }
      let view = `SELECT projectid FROM projects order by projectid desc limit 1`;
      console.log(view);

      pool.query(view, (err, row) => {
        let temp = []
        let idProject = row.rows[0].projectid;

        if (typeof req.body.member == 'string') {
          temp.push(`(${req.body.member}, ${idProject})`)
        } else {
          for (let i = 0; i < req.body.member.length; i++) {
            temp.push(`(${req.body.member[i]}, ${idProject})`)
          }
        }
        let sqlsave = `INSERT INTO members (userid, roles, projectid) values ${temp.join(',')}`;
        console.log(sqlsave);

        pool.query(sqlsave, () => {
          res.redirect('/projects', { isAdmin: req.session.user })
        })
      })
    })
  })


  //=============Router GET Edit============\\
  router.get('/edit/:id', LoginSession.isLoggedIn, (req, res) => {
    console.log('=====================Router Edit Get=============================');
    console.log("==");
    console.log("==");
    console.log("==");

    let edit = parseInt(req.params.id);
    let sql = `SELECT members.userid, projects.name, projects.projectid FROM members LEFT JOIN projects ON projects.projectid = members.projectid WHERE projects.projectid = $1`;
    console.log(sql);
    pool.query(sql, [edit], (err, data) => {
      pool.query(`SELECT * FROM users`, (err, user) => {
        if (err) throw err;
        console.log('suksess edit');
        res.render('projects/edit', {
          name: data.rows[0].name,
          projectid: data.rows[0].projectid,
          members: data.rows.map(item => item.userid),
          users: user.rows,
          isAdmin: req.session.user
        })

      })

    })
  })

  //=========Router POST Edit===========\\
  router.post('/edit/:projectid', (req, res) => {
    // let id = parseInt(req.params.id);
    console.log('=====================Router Edit POST=============================');
    console.log("==");
    console.log("==");
    console.log("==");

    const { name, member } = req.body;
    let id = req.params.projectid;

    let sql = `UPDATE projects SET name= '${req.body.name}' WHERE projectid=${req.params.projectid}`;
    console.log(sql);

    pool.query(sql, (err, row) => {
      if (err) throw err;
      pool.query(`DELETE FROM members WHERE projectid = ${req.params.projectid}`, (err) => {
        let temp = []
        if (typeof req.body.member == 'string') {
          temp.push(`(${req.body.member}, ${id})`)
        } else {
          for (let i = 0; i < member.length; i++) {
            temp.push(`(${member[i]}, ${id})`)
          }
        }

        console.log('Done Update');
        let input = `INSERT INTO members (userid, roles,  projectid)VALUES ${temp.join(",")}`;
        pool.query(input, (err) => {
          res.redirect('/projects')
        })
      })
    });
  });


  //===========Router GET Deleted==========\\
  router.get('/deleted/:projectid', (req, res) => {
    console.log('=====================Router Deleted=============================');
    console.log("==");
    console.log("==");
    console.log("==");

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
    console.log("==");
    console.log("==");
    console.log("==");

    res.redirect('/profile');
  })

  return router;

};