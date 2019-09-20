var express = require('express');
var router = express.Router();
var moment = require('moment');
var pathnode = require('path')

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
    let pathside = "projects";


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
      params.push(`projects.name LIKE '%${name}%'`)
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
            console.log('this data users >', data.rows);

            pool.query(sqloption, (err, options) => {
              // console.log(err, options.rows);
              res.render('projects/index', {
                data: projectData.rows,
                query: req.query,
                users: data.rows,
                current: page,
                pages: pages,
                url: url,
                path, pathside,
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

  //====================Router Over View , Member, Activity, Issue ================\\


  //==========Router Get Overview=========\\
  router.get('/overview/:projectid', LoginSession.isLoggedIn, (req, res) => {
    let path = "overview"
    let pathside = "overview";
    console.log('=====================Router Profile=============================');
    console.log("==");
    console.log("==");
    console.log("==");

    let sql = `SELECT tracker ,count(issueid) as opens FROM issues WHERE projectid = ${req.params.projectid} AND status !='Closed' GROUP BY tracker`;
    let sqltracker = `SELECT tracker ,count(issueid) as total FROM issues WHERE projectid = ${req.params.projectid}  GROUP BY tracker`
    let sqluser = `SELECT users.firstname,lastname FROM members LEFT JOIN users ON members.userid = users.userid WHERE projectid =${req.params.projectid} `;

    let sqloverview = `SELECT projects.name FROM projects WHERE projectid =${req.params.projectid}`;

    pool.query(sql, (err, count) => {
      pool.query(sqltracker, (err, data) => {
        pool.query(sqluser, (err, user) => {
          pool.query(sqloverview, (err, overview) => {

            res.render('projects/overview', {
              count: count.rows,
              overview:overview.rows[0],
              data: data.rows,
              users: user.rows,
              path, pathside,
              isAdmin: req.session.user,//new
              projectid: req.params.projectid
            })

          })

        })
      })
    });
  })

  //==========Router Get Activity=========\\
  router.get('/activity/:projectid', LoginSession.isLoggedIn, (req, res) => {
    let path = "activity"
    let pathside = "activity"
    console.log('=====================Router Acitivity get=============================');
    console.log("==");
    console.log("==");
    console.log("==");

    var days = 7;
    var now = new Date();
    var date = new Date();
    var sevendays = date.setTime(date.getTime() - (days * 24 * 60 * 60 * 1000));

    let sql = `SELECT * FROM activity INNER JOIN users ON activity.author=users.userid WHERE time BETWEEN '${moment(sevendays).format('YYYY-MM-DD')}' AND '${moment(now).add(1, 'days').format('YYYY-MM-DD')}' order by time desc`;
    console.log('this sql acitivity GET>>', sql);

    pool.query(sql, (err, data) => {

      let result = {};
      data.rows.forEach((item) => {
        if (result[moment(item.time).format('dddd')] && result[moment(item.time).format('dddd')].data) {
          result[moment(item.time).format('dddd')].data.push(item);
        } else {
          result[moment(item.time).format('dddd')] = { date: moment(item.time).format('YYYY-MM-DD'), data: [item] };
        }
      })
      console.log(data.rows);

      res.render('projects/activity', {
        projectid: req.params.projectid,
        path, pathside,
        isAdmin: req.session.user,
        data: result,
        now,
        sevendays,
        moment
      })
    })
  })




  //==================================START Get MEMBER======================================================\\

  //==================================Router Get MEMBER======================================================\\
  router.get('/members/:projectid', LoginSession.isLoggedIn, (req, res) => {
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
      temp.push(`CONCAT (users.firstname,' ',users.lastname) LIKE'%${name}%'`)
    }

    if (ckposition && position) {
      temp.push(`members.roles = '${position}'`)
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
      sqlmember += ` ORDER BY members.membersid LIMIT ${limit} OFFSET ${offset}`


      console.log('this sql member>', sqlmember);

      let sqloption = `SELECT memberoption  FROM users  WHERE userid = ${req.session.user.userid}`;
      console.log(sqloption);

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
    console.log('this sql members update>', sql);
    console.log(req.session.user);

    pool.query(sql, (err) => {
      if (err) throw err;

      res.redirect(`/projects/members/${projectid}`);
    })
  })

  router.get('/addMember/:projectid', LoginSession.isLoggedIn, (req, res) => {

    console.log("====================Router GET Members ADD================");
    console.log("==");
    console.log("==");
    console.log("==");

    const pathside = "member";
    let sql = `SELECT DISTINCT users.userid, users.firstname, users.lastname,users.roles
    FROM users LEFT JOIN members ON members.userid = users.userid WHERE members.userid NOT IN(SELECT userid FROM members WHERE projectid = ${req.params.projectid})`;
    console.log(sql);
    pool.query(sql, (err, row) => {
      res.render('members/add', {
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
    const { position } = req.body
    console.log(req.body);


    let sql = `INSERT INTO members(userid, roles, projectid) VALUES(${req.body.name}, '${position}', ${projectid})`;
    console.log(sql);

    pool.query(sql, (err, data) => {
      res.redirect(`/projects/members/${projectid}`)
    })
  })


  router.get('/editMember/:projectid/:membersid', (req, res) => {
    console.log("====================Router GET Members Update================");
    console.log("==");
    console.log("==");
    console.log("==");
    const pathside = "member";

    projectid = req.params.projectid;
    id = req.params.membersid;


    let sql = `SELECT users.firstname, users.lastname, members.roles, membersid FROM members LEFT JOIN users ON users.userid = members.userid left join projects on projects.projectid =  members.projectid WHERE projects.projectid = ${projectid} AND membersid = ${id}`
    console.log(sql);
    pool.query(sql, (err, data) => {
      res.render('members/edit', {
        projectid,
        id: req.params.membersid,
        data: data.rows[0],
        path,
        pathside,
        isAdmin: req.session.user
      })
    })
  })

  router.post('/editMember/:projectid/:membersid', (req, res) => {
    console.log("====================Router POST Members Update================");
    console.log("==");
    console.log("==");
    console.log("==");
    projectid = req.params.projectid;
    id = req.params.membersid;
    const { position } = req.body

    let sql = `UPDATE members SET roles ='${position}' WHERE membersid =${id}`
    console.log(sql);

    pool.query(sql, (err, data) => {
      if (err) { console.log('Not Found') }
      res.redirect(`/projects/members/${projectid}`)
    })
  })

  router.get('/deleteMember/:projectid/:membersid', (req, res) => {
    console.log("====================Router GET Members Deleted================");
    console.log("==");
    console.log("==");
    console.log("==");

    projectid = req.params.projectid;
    id = req.params.membersid;
    let sql = `DELETE FROM members WHERE membersid = ${id}`;
    pool.query(sql, (err, data) => {
      if (err) { console.log('Not Found') }

      console.log('suksess deleted');
      res.redirect(`/projects/members/${projectid}`)

    })
  })

  //=========================================END ROUTER MEMBER============================\\

  //=========================================START ROUTER ISSUES============================\\
  //=========================================GET ROUTER ISSUES============================\\
  router.get('/issues/:projectid', LoginSession.isLoggedIn, (req, res) => {
    let path = "issues"
    console.log("=================Router Get  Issues============");
    console.log("==");
    console.log("==");
    console.log("==");


    const { ckid, issueid, cksubject, subject, cktracker, tracker } = req.query;
    let temp = []
    const pathside = "issues";
    console.log(req.url)
    const url = (req.url == `/issues/${req.params.projectid}`) ? `/issues/${req.params.projectid}/?page=1` : req.url
    let page = req.query.page || 1;
    let limit = 3;
    let offset = (page - 1) * limit

    if (ckid && issueid) {
      temp.push(`issues.issueid = ${issueid}`)
    }

    if (cksubject && subject) {
      temp.push(`issues.subject LIKE '%${subject}%'`)
    }

    if (cktracker && tracker) {
      temp.push(`issues.tracker= '${tracker}'`)
    }
    let sql = `SELECT count(*) as total FROM issues WHERE projectid = ${req.params.projectid}`;

    // if (temp.length > 0) {
    //   sql += ` WHERE ${temp.join(" AND ")}`
    // }
    console.log('this sql isse>> ', sql);

    console.log('this temp push', temp.push);

    pool.query(sql, (err, count) => {
      const total = count.rows[0].total
      const pages = Math.ceil(total / limit)

      let sqlissues = `SELECT * FROM issues WHERE projectid = ${req.params.projectid}`;
      if (temp.length > 0) {
        sqlissues += ` AND ${temp.join(" AND ")}`
      }
      sqlissues += ` ORDER BY issues.issueid LIMIT ${limit} OFFSET ${offset}`


      console.log('this sql issues>', sqlissues);

      let sqloption = `SELECT issueoption  FROM users  WHERE userid = ${req.session.user.userid}`;

      console.log(sqloption);


      pool.query(sqlissues, (err, data) => {
        if (err) { console.log('Not Found') }
        pool.query(sqloption, (err, option) => {
          res.render('issues/issues', {
            data: data.rows,
            projectid: req.params.projectid,
            current: page,
            pages: pages,
            url: url,
            fullname: data.fullname,
            options: option.rows[0].issueoption,
            pathside, path,
            isAdmin: req.session.user,
            query: req.query
          })
        })
      });
    })
  })
  router.post('/updateIssues/:projectid', (req, res) => {

    console.log("====================Router Post options================");
    console.log("==");
    console.log("==");
    console.log("==");

    let sql = `UPDATE users SET issueoption = '${JSON.stringify(req.body)}' WHERE userid =${req.session.user.userid} `
    console.log(sql);
    console.log(req.session.user);

    pool.query(sql, (err) => {
      if (err) throw err;

      res.redirect(`/projects/issues/${req.params.projectid}`);
    })

  })



  router.get('/addIssues/:projectid', LoginSession.isLoggedIn, (req, res) => {
    let path = "issues"
    console.log("=================Router Get ADD Issues============");
    console.log("==");
    console.log("==");
    console.log("==");

    const pathside = "issues";
    projectid = req.params.projectid;

    let sql = `SELECT projects.projectid, users.userid, users.firstname, users.lastname FROM members LEFT JOIN projects ON projects.projectid = members.projectid LEFT JOIN users ON members.userid = users.userid WHERE members.projectid =${projectid} `;

    pool.query(sql, (err, data) => {
      res.render('issues/add', {
        data: data.rows,
        projectid: req.params.projectid,
        path,
        pathside,
        isAdmin: req.session.user
      })
    })
  })
  //==============================================================================================================================\\
  router.post('/addIssues/:projectid', LoginSession.isLoggedIn, (req, res) => {
    let path = "issues"
    console.log("=================Router POST ADD  Issues============");
    console.log("==");
    console.log("==");
    console.log("==");

    let author = req.session.user.userid
    console.log('this author issues', author);

    const { tracker, subject, description, status, priority, assignee, startdate, duedate, estimatedtime, progres } = req.body;
    let upload = req.files.doc;
    let filename = upload.name.toLowerCase().replace('', Date.now());
    // console.log(req.files.doc);


    let sql = `INSERT INTO issues(tracker, subject, description, status, priority, startdate, duedate, estimatedate, done, files, assignee, projectid, author ,createddate, updatedate) VALUES ('${tracker}', '${subject}','${description}','${status}','${priority}','${startdate}','${duedate}','${estimatedtime}','${progres}','${filename}',${assignee},${req.params.projectid},${author}, now(), now())`

    console.log('this sql issue add>>', sql);

    if (req.files) {
      upload.mv(pathnode.join(__dirname, `../public/images/${filename}`)), (err) => {
        if (err) console.log(err);
      }
    }
    pool.query(sql, (err) => {
      if (err) { console.log(err) };
      res.redirect(`/projects/issues/${req.params.projectid}`)
    })
  })

  //==================================================EDIT ROUTER ISSUES========================================================\\

  router.get('/editIssues/:projectid/:issueid', LoginSession.isLoggedIn, (req, res) => {
    let path = "issues"
    console.log("=================Router GET EDIT  Issues============");
    console.log("==");
    console.log("==");
    console.log("==");
    pathside = "issue"

    projectid = req.params.projectid;
    id = req.params.issueid;

    let sql = `SELECT * FROM issues WHERE issueid = ${id}`;
    let sqluser = `SELECT users.userid, users.firstname, users.lastname FROM users`;
    console.log('this sql edit issues>', sql);
    console.log('this sqlusers issues>', sqluser);

    pool.query(sql, (err, data) => {
      pool.query(sqluser, (err, datauser) => {
        res.render('issues/edit', {
          issues: data.rows,
          datauser: datauser.rows,
          data: data.rows[0],
          projectid,
          id,
          path,
          pathside,
          moment,
          isAdmin: req.session.user
        })
      })
    })
  })

  router.post('/editIssues/:projectid/:issueid', LoginSession.isLoggedIn, (req, res) => {
    let path = "issues"
    console.log("=================Router POST EDIT  Issues============");
    console.log("==");
    console.log("==");
    console.log("==");

    let author = req.session.user.userid;
    console.log('this author Edit issues>>', author);

    const { tracker, subject, description, status, priority, assignee, startdate, duedate, estimatetime, progres, spenttime, targetversion, parenttask, createddate, filename } = req.body;

    if (req.files) {

      let upload = req.files.doc;
      filename = upload.name.toLowerCase().replace('', Date.now());
      upload.mv(pathnode.join(__dirname, `../public/images/${filename}`)), (err) => {
        if (err) console.log(err);
      }

    }
    if (status == 'Closed') {
      sql = `UPDATE issues SET tracker ='${tracker}',
                              subject = '${subject}',
                              description ='${description}',
                              status = '${status}',
                              priority = '${priority}',
                              startdate ='${startdate}',
                              duedate = '${duedate}',
                              estimatedate =${estimatetime},
                              done = ${progres},
                              files ='${filename}',
                              spenttime =${spenttime},
                              targetversion =${targetversion},
                              parenttask = ${parenttask},
                              author = ${author},
                              updatedate =  now(),
                              closeddate = now(),
                              assignee = ${assignee} WHERE issueid =${req.params.issueid};
      `
    } else {
      sql = `UPDATE issues SET tracker ='${tracker}',
                              subject = '${subject}',
                              description ='${description}',
                              status = '${status}',
                              priority = '${priority}',
                              startdate ='${startdate}',
                              duedate = '${duedate}',
                              estimatedate =${estimatetime},
                              done = ${progres},
                              files ='${filename}',
                              spenttime =${spenttime},
                              targetversion =${targetversion},
                              parenttask = ${parenttask},
                              author = ${author},
                              updatedate =  now(),
                              assignee = ${assignee} WHERE issueid = ${req.params.issueid}`;
    }
    console.log('this sql edit issues >>', sql);
    let title = `${subject}#${req.params.issueid} (${status})`

    pool.query(sql, (err, data) => {

      let activity = `INSERT INTO activity (title, description, author,time) VALUES('${title}', '${description}',${req.session.user.userid}, now())`;

      console.log('this sql activity>>', activity);

      pool.query(activity, (err) => {
        if (err) { console.log('Not Found', err) }
        res.redirect(`/projects/issues/${projectid}`)


      })
    })
  })

  //=======================Router Get Deleted Issues=============\\
  router.get('/deletedIssues/:projectid/:issueid', (req, res) => {
    console.log("=================Router GET DELETED  Issues============");
    console.log("==");
    console.log("==");
    console.log("==");
    projectid = req.params.projectid;
    id = req.params.issueid;
    let sql = `DELETE FROM issues WHERE issueid = ${id}`;
    pool.query(sql, (err, data) => {
      if (err) { console.log('Not Found') }

      console.log('suksess deleted');
      res.redirect(`/projects/issues/${projectid}`)

    })
  })

  return router;

};