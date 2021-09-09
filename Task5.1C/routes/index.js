var express = require('express');
var router = express.Router();
const dburl = 'mongodb://superuser:789110a@47.102.47.144:27017'
const MongoClient = require('mongodb').MongoClient
const email = require('../libs/sendEmail.js')
const bcrypt = require('bcrypt');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});

// get show page
router.get('/show', function (req, res, next) {
    res.render('show');
});

// showdatabase
router.get('/showdata', function (req, res, next) {
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        const homework = db.db('homework')
        homework.collection('customerreg').find().toArray((err, result) => {
            if (err) throw err
            res.send(result)
            db.close()
        })
    });
});

// insert database and send email
router.post('/reg', async function (req, res, next) {

    // 检测邮箱是否被注册
    function checkEmail() {
        return new Promise((resolve, reject) => {
            MongoClient.connect(dburl, function (err, db) {
                if (err) throw err;
                const homework = db.db('homework')
                homework.collection('customerreg').find({ email: req.body.email }).toArray((err, result) => {
                    if (err) throw err
                    console.log(result);
                    if (result.length != 0) {
                        reject('is wrong')
                    }
                    db.close()
                    resolve()
                })
            });
        })
    }
    await checkEmail().catch((err) => {
        if (err) {
            res.send('500')
            throw err
        }
    })

    // 将密码加密
    function encrypt() {
        return new Promise((resolve, reject) => {
            bcrypt.hash(req.body.password, 10, function (err, hash) {
                req.body.password = hash
                req.body.cpassword = hash
                resolve()
            });
        })
    }
    await encrypt()

    // 将数据添加进数据库
    function addData() {
        return new Promise((resolve, reject) => {
            MongoClient.connect(dburl, function (err, db) {
                if (err) throw err;
                const homework = db.db('homework')
                homework.collection('customerreg').insertOne(req.body, (err, result) => {
                    if (err) throw err
                    db.close()
                    resolve()
                })
            });
        })
    }
    await addData()

    // 发送邮件
    function sendEmail() {
        let html = `<p>Hi, ${req.body.firstName}  ${req.body.lastName},  welcome registration success</p>`
        return new Promise((resolve, reject) => {
            email.sendMail(req.body.email, html, (state) => {
                resolve()
            })
        })
    }
    await sendEmail()

    // 最后跳转到登录页面
    res.send('200')

});

// bcrypt test
// router.get('/bcrypt', function (req, res, next) {
//     const saltRounds = 10;
//     const myPlaintextPassword = 'hello';
//     const someOtherPlaintextPassword = 'not_bacon';

//     bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
//         // Store hash in your password DB.
//         if(err) console.log(err);
//         console.log(hash);
//         bcrypt.compare(myPlaintextPassword, '$2b$10$K8njG7f1ZEmilL2jfSs2/O//QPxp7Z5GVu6FYmUra6DLsIuuW4Bvu', function(err, result) {
//             console.log(result);
//             res.send(hash)
//         });
//     });
// });

// login page
router.get('/login', function (req, res, next) {
    res.render('login');
});

// check login
router.post('/checklogin', function (req, res, next) {
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        const homework = db.db('homework')
        homework.collection('customerreg').find({ email: req.body.email }).toArray((err, result) => {
            if (err) throw err
            console.log(result);

            if (result.length == 0) {
                res.send('404')
            } else {
                bcrypt.compare(req.body.pwd, result[0].password, function (err2, result2) {
                    if(result2 == false) {
                        res.send('500')
                    }
                    if(result2 == true) {
                        res.send('200')
                    }
                });
            }


            db.close()
        })
    });
})

// login success page
router.get('/success', function (req, res, next) {
    console.log(req.query.e);
    res.render('success', {email:req.query.e});
});

module.exports = router;
