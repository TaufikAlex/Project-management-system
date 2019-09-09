var express = require('express');
var router = express.Router();
var moment = require('moment');
const bodyParser = require('body-parser');
moment().format();

//------BODY PARSER-----------\\
// parse application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
router.use(bodyParser.json())
//----------END BP----------\\

module.exports = (pool) => {

  /* GET home page. */
  router.get('/', function (req, res, next) {
    console.log("masuk projects");

    const { ckid, id, ckname, name, ckmember, member } = req.query;
    let temp = []

    let stat = false

    // ---------------------------- function filter ----------------------------
    if (ckid && id) {
      temp.push(`projectid = ${id}`)
      stat = true
    }

    if (ckname && name) {
      temp.push(`"name" = '${name}'`)
      stat = true
    }

    if (ckmember && member) {
      temp.push(`membersid = ${member}`)
      stat = true
    }

    //------------------------------------------------------------------------------------ 
    // conversi dari array ke string
    let joindata = temp.join(' and ');

    console.log(joindata);
    let sql = `SELECT count(*) as total FROM projects`;
    //  kondisi ketika filter
    if (stat == true) {
      sql += ` where ${joindata} `
    }
    pool.query(sql, [], (err, count) => {
      let rows = count.rows[0].total //jumlah data dalam/projects?page=1&ckid=on&id=1&name=&member= table
      console.log(count[0]);

      sql = `select * from projects`;
      if (stat == true) {
        sql += ` where ${joindata} `
      }
      pool.query(sql, [], (err, row) => {

        res.render('projects/index', { data: row.rows, moment });

      })


    });
  });
//=========Router GET ADD=============\\
  router.get('/add', (req, row) => row.render('projects/add'))

//=============Router POST ADD===========\\
  router.post('/add', (req, res) => {
    const sqladd = `INSERT INTO projects ("name") VALUES ('${req.body.name}')`;
    pool.query(sqladd, (err) => {
      if (err) throw err;

      console.log('Susccess add Projects');
      res.redirect('/projects')

    })
  })

//=============Router GET Edit============\\
  router.get('/edit/:id',(req, res) => {
    let edit = parseInt(req.params.id);
    let sql = `SELECT * FROM projects WHERE projectid=$1`;
    console.log(sql);
    pool.query(sql,[edit],(err,data) =>{
      if (err) throw err;

      console.log('suksess edit');
      res.render('projects/edit', {item: data.rows[0], moment})
      
    })    
  })

//=========Router POST Edit===========\\
  router.post('/edit/:projectid', (req,res) => {
    // let id = parseInt(req.params.id);
    let sql = `UPDATE projects SET name= '${req.body.name}' WHERE projectid=${req.params.projectid}`;
    console.log(sql);  

    pool.query(sql,(err,row)=> {
      if (err) throw err;

      console.log('Done Update');
      
      res.redirect('/projects')
    })
  })

//===========Router GET Deleted==========\\
  router.get('/deleted/:projectid',(req,res)=>{
    let sql = `DELETE FROM projects WHERE projectid=${req.params.projectid}`;
    console.log(sql);
    pool.query(sql,(err)=>{
      if (err) throw err;
      console.log('suksess deleted');
      res.redirect('/projects');
    })
    
  })

  return router;

};