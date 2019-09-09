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

        res.render('login', { title: 'prokect management system' });


    });
    //==============Router Login===========\\
    router.post('/login', function (req, res, next) {
        const { email, password } = req.body;
        let sql = `SELECT * FROM users WHERE email =$1`;
        pool.query(sql, [email]).then(row => {
            if (row.rows[0].email != null) {
                if (row.rows[0].password == password) {
                    req.session.user = row.rows[0]
                    res.redirect('/projects')
                    console.log(row.rows[0]);

                } else {
                    res.redirect('/')
                }
                res.redirect('/')
            }
        }).catch(err => {
            console.log(err);
        })

    });

    // res.redirect('projects/index', {});

    return router;

};

