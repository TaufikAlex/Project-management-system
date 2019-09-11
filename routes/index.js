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
        // console.log("wrong",req.flash('loginInfo'));
        console.log("============================Router Index Login====================");
        console.log("");
        console.log("");
        console.log("");

        res.render('login', {
            title: 'login',
            user: req.session.user,
            loginInfo: req.flash('loginInfo')[0]
            // loginMessage: req.flash('loginMessage')
        });
        // res.render('login', { title: 'prokect management system',loginInfo: req.flash('loginInfo')[0]});


    });
    //==============Router Login===========\\
    router.post('/login', function (req, res, next) {
        console.log("============================Router Index Login====================");
        console.log("");
        console.log("");
        console.log("");
        const { email, password } = req.body;
        let sql = `SELECT * FROM users WHERE email =$1`;
        pool.query(sql, [email]).then(row => {
            if (row.rows.length > 0) {
                if (row.rows[0].password == password) {
                    req.session.user = row.rows[0]
                    res.redirect('/projects')
                } else {
                    console.log('Salah password');

                    req.flash('loginInfo', 'user or password doesnt match')
                    res.redirect('/')
                }
            } else {
                req.flash('loginInfo', 'user doesnt exist')
                res.redirect('/')
            }
        }).catch(err => {
            console.log(err);
            req.flash('loginInfo', 'Try Again')
            res.redirect('/')
        })
    });

    router.get('/logout', function (req, res, next) {
        req.session.destroy(function (err) {
            res.redirect('/')
        })
    })


    return router;

};

