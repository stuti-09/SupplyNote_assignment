const express = require('express');
const router = express.Router();
const user = require('../model/user');
const urls = require('../model/url');
const bcryptjs = require('bcryptjs');
const passport = require('passport');
const shortid = require("shortid");
const validUrl = require("valid-url");
require('./passportLocal')(passport);



function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        next();
    } else {
        req.flash('error_messages', "Please Login to continue !");
        res.redirect('/login');
    }
}
router.get('/',(req,res)=>{
    res.render("index",{ csrfToken: req.csrfToken() })
})

router.get('/login', (req, res) => {
    res.render("login", { csrfToken: req.csrfToken() });
});

router.get('/signup', (req, res) => {
    res.render("signup", { csrfToken: req.csrfToken() });
});

router.post('/signup', (req, res) => {
    // get all the values 
    const { email, password, confirmpassword } = req.body;
    // check if the are empty 
    if (!email || !password || !confirmpassword) {
        res.render("signup", { err: "All Fields Required !", csrfToken: req.csrfToken() });
    } else if (password != confirmpassword) {
        res.render("signup", { err: "Password Don't Match !", csrfToken: req.csrfToken() });
    } else {

        // validate email and username and password 
        // skipping validation
        // check if a user exists
        user.findOne({ email: email }, function (err, data) {
            if (err) throw err;
            if (data) {
                res.render("signup", { err: "User Exists, Try Logging In !", csrfToken: req.csrfToken() });
            } else {
                // generate a salt
                bcryptjs.genSalt(12, (err, salt) => {
                    if (err) throw err;
                    // hash the password
                    bcryptjs.hash(password, salt, (err, hash) => {
                        if (err) throw err;
                        // save user in db
                        user({
                            email: email,
                            password: hash,
                            provider: 'email',
                        }).save((err, data) => {
                            if (err) throw err;
                            // login the user
                            // use req.login
                            // redirect , if you don't want to login
                            res.redirect('/login');
                        });
                    })
                });
            }
        });
    }
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        failureRedirect: '/login',
        successRedirect: '/dashboard',
        failureFlash: true,
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    req.logout();
    req.session.destroy(function (err) {
        res.redirect('/');
    });
});

/*router.get('/google', passport.authenticate('google', { scope: ['profile', 'email',] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/dashboard');
});*/

router.get('/dashboard', checkAuth, (req, res) => { 
    urls.find({ owned : req.user.email }, (err, data) => {
        if(err) throw err; 
        res.render('dashboard', { logged: true, csrfToken: req.csrfToken(), urls : data });
        
    }); 
});


router.post('/create', checkAuth, async(req, res) => {
    const longUrl = req.body.longUrl;
    const baseUrl ="https://shortlyapp.cyclic.app/"
    

    const urlCode = shortid.generate();
    try{
        var url = await urls.findOne({longUrl : longUrl});
        if(url){
            return res.render('dashboard', { logged: true, csrfToken: req.csrfToken(), err: "Try Different Short Url, This exists !" });
        }else{

            const shortUrl = baseUrl + "/" + urlCode;
            url  = new urls({
                owned:req.user.email,
                longUrl,
                shortUrl,
                urlCode,
                clickCount: 0,
                date: new Date()
            });
            
             await url.save()
             return res.redirect('/dashboard')
        }
    }catch (error){
        console.log(error)
    }

    

});

router.get('/:shortUrl',async(req,res)=>{
    
    
    var shortUrlCode = req.params.shortUrl;
    var url =await  urls.findOne({ urlCode: shortUrlCode });
    
    try{
        if(url){

            var clickCount = url.clickCount;
            clickCount=clickCount + 1 ;
            console.log(clickCount)
            await url.update({ clickCount });
            let time1=url.date
            let time2=new Date()
            const diff=(time1-time2)/(1000*3600)
            if(diff>48){
                url.delete()
                res.render('dashboard', { logged: true, csrfToken: req.csrfToken(), err: "Url invalid! Create new" })
            }
             return res.redirect(url.longUrl)
            
            
        }else{
            res.render('dashboard', { logged: true, csrfToken: req.csrfToken(), err: "The short url doesn't exists in our system." })
        }

    }catch(err){
        console.log(err)
    }
})






module.exports = router;