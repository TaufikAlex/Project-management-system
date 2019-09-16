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

var path = "projects";
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
              res.render('projects/index', {
                data: projectData.rows,
                query: req.query,
                users: data.rows,
                current: page,
                pages: pages,
                url: url,
                path,
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

    let sql = `UPDATE users SET projectsoptions = '${JSON.stringify(req.body)}' WHERE userid =${req.session.user.userid} `
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
      res.render('projects/add', { data: row.rows, isAdmin: req.session.user, path })
    })
  })
  // ============================= Router ADD Post Project =============================
  router.post('/add', LoginSession.isLoggedIn, (req, res) => {
    console.log("============================Router Post ADD========================");
    console.log("==");
    console.log("==");
    console.log("==");
    console.log("==");
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
          res.redirect('/projects')
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
          path,
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

  //==========Router Get Overview=========\\
  router.get('/overview/:projectid', (req, res) => {
    let path = "overview"
    console.log('=====================Router Profile=============================');
    console.log("==");
    console.log("==");
    console.log("==");

    res.render('projects/overview', {
      path,
      projectid: req.params.projectid
    });
  })

  //==========Router Get Overview=========\\
  router.get('/activity/:projectid', (req, res) => {
    let path = "activity"
    console.log('=====================Router Profile=============================');
    console.log("==");
    console.log("==");
    console.log("==");

    res.render('projects/activity', {
      path,
      projectid: req.params.projectid
    });
  })


  //==================================Router Get MEMBER======================================================\\
  router.get('/members/:projectid',LoginSession.isLoggedIn, (req, res) => {
    let path = "members"
    console.log("=================Router Get Overview Members============");
    console.log("==");
    console.log("==");
    console.log("==");


    const { ckid, memberid, ckname, name, ckposition, position } = req.query;
    let temp = []
    const pathside = "member";
    console.log(req.url)
    const url = (req.url == `/members/${req.params.projectid}`) ? `/members/${req.params.projectid}/?page=1` : req.url
    let page = req.query.page || 1;
    let limit = 3;
    let offset = (page - 1) * limit

    if (ckid && memberid) {
      temp.push(`members.membersid = ${memberid}`)
    }

    if (ckname && name) {
      temp.push(`fullname = ${name}`)
    }

    if (ckposition && position) {
      temp.push(`members.roles = "${position}"`)
    }
    let sql = `SELECT count(*) as total FROM members WHERE members.projectid = ${req.params.projectid}`;
    // if (temp.length > 0) {
    //   sql += ` WHERE ${temp.join(" AND ")}`
    // }
    pool.query(sql, (err, count) => {
      const total = count.rows[0].total
      const pages = Math.ceil(total / limit)
      let sqlmember = `SELECT projects.projectid, members.membersid, members.roles, CONCAT (users.firstname,' ',users.lastname) AS fullname FROM members LEFT JOIN projects ON projects.projectid = members.projectid LEFT JOIN users ON users.userid = members.userid WHERE members.projectid = ${req.params.projectid}`;
      if (temp.length > 0) {
        sqlmember += ` AND ${temp.join(" AND ")}`
      }
      sqlmember += ` ORDER BY members.projectid LIMIT ${limit} OFFSET ${offset}`
      

      console.log('this sql member>',sqlmember);

      let sqloption = `SELECT memberoption  FROM users  WHERE userid = ${req.session.user.userid}`;

      pool.query(sqlmember, (err, data) => {
        pool.query(sqloption, (err, option) => {
          res.render('members/list', {
            data: data.rows,
            projectid: req.params.projectid,
            current: page,
            pages: pages,
            url: url,
            fullname: data.fullname,
            option: option.rows[0].memberoption,
            pathside, path,
            isAdmin: req.session.user,
            query: req.query
          })
        })
      });
    })
  });

  router.post('/optionmember/:projectid', (req, res) => {
    projectid = req.params.projectid;

    console.log("====================Router Post Members options================");
    console.log("==");
    console.log("==");
    console.log("==");

    let sql = `UPDATE users SET memberoption = '${JSON.stringify(req.body)}' WHERE userid =${req.session.user.userid} `
    console.log('this sql members update>',sql);
    console.log(req.session.user);

    pool.query(sql, (err) => {
      if (err) throw err;

      res.redirect(`/projects/members/${projectid}`);
    })
  })

  router.get('/addMember/:projectid',LoginSession.isLoggedIn,(req, res) =>{

    console.log("====================Router GET Members ADD================");
    console.log("==");
    console.log("==");
    console.log("==");

    const pathside = "member";
    let sql = `SELECT users.userid, users.firstname, users.lastname,users.roles, members.projectid
    FROM users LEFT JOIN members ON members.userid = users.userid WHERE projectid IS NULL`;
    console.log(sql);
    pool.query(sql,(err,row) => {
      res.render('members/add',{
        data: row.rows,
        projectid: req.params.projectid,
        isAdmin: req.session.user,
        path,
        pathside
      })
    })
  })

  router.post('/addMember/:projectid', (req, res) => {
    console.log("====================Router POST Members ADD================");
    console.log("==");
    console.log("==");
    console.log("==");

    projectid = req.params.projectid;
    const { position} = req.body
    console.log(req.body);
    

    let sql = `INSERT INTO members(userid, roles, projectid) VALUES(${req.body.name}, '${position}', ${projectid})`;
    console.log(sql);
    
    pool.query(sql, (err, data) => {
      res.redirect(`/projects/members/${projectid}`)
    })
  })

  
  router.get('/editMember/:projectid/:membersid',(req, res) => {
    console.log("====================Router GET Members Update================");
    console.log("==");
    console.log("==");
    console.log("==");
    const pathside = "member";

    projectid = req.params.projectid;
    id = req.params.membersid;


    let sql = `SELECT users.firstname, users.lastname, members.roles, membersid FROM members LEFT JOIN users ON users.userid = members.userid left join projects on projects.projectid =  members.projectid WHERE projects.projectid = ${projectid} AND membersid = ${id}`
    console.log(sql);
    pool.query(sql,(err,data) => {
      res.render('members/edit',{
        projectid,
        id: req.params.membersid,
        data: data.rows[0],
        path,
        pathside,
        isAdmin: req.session.user
      })
    })
  })

  router.get('/editMember/:projectid/:membersid',(req, res) => {
    console.log("====================Router POST Members Update================");
    console.log("==");
    console.log("==");
    console.log("==");
    projectid = req.params.projectid;
    id = req.params.membersid;
    const {position} = req.body

    let sql =`UPDATE members SET roles ='${position}', WHERE =${id}`
    pool.query(sql, (err, data) =>{
      if (err) { console.log('Not Found') }
      res.redirect('/projects/members/${projectid}')
    })

  })

  return router;

};