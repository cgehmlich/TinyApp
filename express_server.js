var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
app.set('view engine', 'ejs');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const bcrypt = require('bcrypt');
const cookieSession = require("cookie-session");
app.use(cookieSession({
    name: 'session',
    keys: ['secret', 'anothersecret', 'andanothersecret'],
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
// DBS
const urlDatabase = {
    'f4xd67': {
        userID: 'userRandomID',
        shortURL: 'f4xd67',
        longURL: 'http://www.lighthouselabs.ca'
    },
    'ki4fb2': {
        userID: 'user2RandomID',
        shortURL: 'ki4fb2',
        longURL: 'http://www.google.com'
    }
}
const users = {
    'userRandomID': {
        id: 'userRandomID',
        email: 'user@example.com',
        password: 'purple-monkey-dinosaur'
    },
    'user2RandomID': {
        id: 'user2RandomID',
        email: 'user2@example.com',
        password: 'dishwasher-funk'
    }
}
// FUNCTIONS ---------------------------------------------------
function generateRandomString() {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var string_length = 6;
    var randomstring = '';
    for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
}
function urlsForUser(uId) {
    let filtered = {};
    for (let url in urlDatabase) {
        let shortUrl = urlDatabase[url].shortURL;
        if (urlDatabase[url].userID === uId)
            filtered[shortUrl] = urlDatabase[url];
    }
    return filtered;
}
// GETS -------------------------------------------------------
app.get('/', (req, res) => {
    if (req.session.userID) {
        res.redirect('/urls');
    } else {
        res.redirect('/login');
    }
});
app.get('/register', (req, res) => {
    if (req.session.userID) {
        res.redirect('/');
    } else {
        res.status(200);
        res.render('urls_reg', {
            userID: null
        });
    }
});
app.get('/login', (req, res) => {
    if (req.session.userID) {
        res.redirect('/');
    } else {
        res.status(200);
        res.render('urls_login', {
            userID: req.session.userID,
            email: app.locals.email
        });
    }
});
app.get('/hello', (req, res) => {
    res.end('<html><body>Hello <b>World</b></body></html>\n');
});
app.get('/urls.json', (req, res) => {
    res.json(urlDatabase);
});
app.get('/urls', (req, res) => {
    if (req.session.userID) {
        const filteredDB = urlsForUser(req.session.userID);
        let templateVars = {
            usersDB: users,
            urls: filteredDB,
            userID: req.session.userID,
            email: app.locals.email
        };
        res.status(200);
        res.render('urls_index', templateVars);
    } else {
        let templateVars = {
            errCode: 401,
            errMsg: 'Login first'
        }
        res.status(401);
        res.render('error', templateVars);
    }
});
app.get('/u/:id', (req, res) => {
    let sUrl = req.params.id;
    if (urlDatabase[sUrl]) {
        res.redirect(urlDatabase[sUrl].longURL);
    } else {
        let templateVars = {
            errCode: 404,
            errMsg: 'Invalid short URL'
        }
        res.status(404);
        res.render('error', templateVars);
    }
});
app.get('/urls/new', (req, res) => {
    if (req.session.userID) {
        res.status(200);
        res.render('urls_new', {
            usersDB: users,
            userID: req.session.userID,
            email: app.locals.email
        });
    } else {
        let templateVars = {
            errCode: 401,
            errMsg: 'Login first'
        }
        res.status(401);
        res.render('error', templateVars);
    }
});
app.get('/urls/:id', (req, res) => {
    const filteredDB = urlsForUser(req.session.userID);
    if (!urlDatabase[req.params.id]) {
        let templateVars = {
            errCode: 404,
            errMsg: 'Invalid URL'
        }
        res.status(404);
        res.render('error', templateVars);
    }
    else if (!req.session.userID) {
        let templateVars = {
            errCode: 401,
            errMsg: 'Login first'
        }
        res.status(401);
        res.render('error', templateVars);
    }
    else if (req.session.userID !== urlDatabase[req.params.id].userID) {
        let templateVars = {
            errCode: 403,
            errMsg: "Login as URL owner"
        }
        res.status(403);
        res.render('error', templateVars);
    }
    else {
        let templateVars = {
            usersDB: users,
            urls: filteredDB,
            shortUrl: req.params.id,
            userID: req.session.userID,
            email: app.locals.email
        };
        res.render('urls_show', templateVars);
    }
});
// POSTS -------------------------------------------------------------------
app.post('/register', (req, res) => {
    if (!req.body.email || !req.body.password) {
        const templateVars = {
            errCode: 400,
            errMsg: 'Incorrect user credentials'
        }
        res.status(400);
        res.render('error', templateVars);
    } else {
        for (let user in users) {
            if (users[user].email === req.body.email) {
                const templateVars = {
                    errCode: 400,
                    errMsg: 'Email address already exists'
                }
                res.status(400);
                res.render('error', templateVars);
            }
        }
        const useremail = req.body.email;
        app.locals.email = req.body.email;
        const hashedPassword = bcrypt.hashSync(req.body.password, 10);
        const id = generateRandomString();
        users[id] = {
            id,
            email: useremail,
            password: hashedPassword
        }
        req.session.userID = id
        res.redirect('/');
    }
});
app.post('/login', (req, res) => {
    const emailInput = req.body.email;
    app.locals.email = req.body.email;
    const password = req.body.password;
    for (let id in users) {
        if (users[id].email === emailInput && bcrypt.compareSync(password, users[id].password)) {
            req.session.userID = id;
            res.redirect('/');
            return;
        }
    }
    const templateVars = {
        errCode: 401,
        errMsg: 'Incorrect user credentials'
    }
    res.status(401);
    res.render('error', templateVars);
});
app.post('/logout', (req, res) => {
    req.session = null;
    app.locals.email = '';
    res.redirect('/');
});
app.post('/urls', (req, res) => {
    if (req.session.userID) {
        let randomString = generateRandomString();
        urlDatabase[randomString] = {
            longURL: req.body.longURL,
            userID: req.session.userID,
            shortURL: randomString
        };
        const filteredDB = urlsForUser(req.session.userID);
        let templateVars = {
            usersDB: users,
            urls: filteredDB,
            userID: req.session.userID,
            email: app.locals.email
        };
        res.redirect('/urls/' + randomString);
    } else {
        let templateVars = {
            errCode: 401,
            errMsg: 'Login first'
        }
        res.status(401);
        res.render('error', templateVars);
    }
});
app.post('/urls/:shortUrl/', (req, res) => {
    const sUrl = req.params.shortUrl;
    if (!urlDatabase[sUrl]) {
        let templateVars = {
            errCode: 404,
            errMsg: 'Invalid URL'
        }
        res.status(404);
        res.render('error', templateVars);
    }
    else if (!req.session.userID) {
        let templateVars = {
            errCode: 401,
            errMsg: 'Login first'
        }
        res.status(401);
        res.render('error', templateVars);
    }
    else if (req.session.userID !== urlDatabase[sUrl].userID) {
        let templateVars = {
            errCode: 403,
            errMsg: "Login as URL owner"
        }
        res.status(403);
        res.render('error', templateVars);
    }
    else {
        urlDatabase[sUrl].longURL = req.body.longURL;
        const filteredDB = urlsForUser(req.session.userID);
        let templateVars = {
            usersDB: users,
            urls: filteredDB,
            userID: req.session.userID,
            email: app.locals.email
        };
        res.render('urls_index', templateVars);
    }
});
app.post('/urls/:shortUrl/delete', (req, res) => {
    if (req.session.userID) {
        delete urlDatabase[req.params.shortUrl];
        const filteredDB = urlsForUser(req.session.userID);
        let templateVars = {
            usersDB: users,
            urls: filteredDB,
            userID: req.session.userID,
            email: app.locals.email
        };
        res.render('urls_index', templateVars);
    }
    else {
        let templateVars = {
            errCode: 401,
            errMsg: 'Login first'
        }
        res.status(401);
        res.render('error', templateVars);
    }
});
//---------------------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});