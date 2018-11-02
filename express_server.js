var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
app.set('view engine', 'ejs');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const cookieSession = require("cookie-session");
app.use(cookieSession({
    name: 'session',
    keys: [/* secret keys */],
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
const bcrypt = require('bcrypt');
var urlDatabase = [
    {
        shortURL: "b2xVn2",
        longURL: "http://www.lighthouselabs.ca",
        userID: ""
    },
    {
        shortURL: "9sm5xK",
        longURL: "http://www.google.com",
        userID: ""
    }
];
const users = {
    "userRandomID": {
        id: "userRandomID",
        email: "user@example.com",
        password: "purple-monkey-dinosaur"
    },
    "user2RandomID": {
        id: "user2RandomID",
        email: "user2@example.com",
        password: "dishwasher-funk"
    }
}
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
function urlsForUser(id) {
    const result = urlDatabase.filter(url => url.userID === id)
    return result;
}
app.get("/", (req, res) => {
    res.send("Hello!");
});
app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});
app.get("/urls", (req, res) => {
    let user = {};
    console.log("am I okay?");
    if (req.session.user_id) {
        id = req.session.user_id
        user = users[id];
    }
    newDB = urlsForUser(req.session.user_id)
    console.log(urlDatabase)
    let templateVars = { urls: urlDatabase, user, newDB };
    res.render("urls_index", templateVars);
});
app.get("/urls/new", (req, res) => {
    if (req.session.user_id) {
        id = req.session.user_id
        user = users[id];
        let templateVars = { urls: urlDatabase, user };
        res.render("urls_new"), templateVars
    }
    else { res.redirect("/login") }
});
app.get("/urls/:id", (req, res) => {
    if (req.session.user_id) {
        id = req.session.user_id
        user = users[id];
    }
    let short = req.params.id;
    const index = urlDatabase.findIndex(url => url.shortURL === short)
    let url = urlDatabase[index];
    if (urlDatabase[index].userID !== req.session.user_id) { res.status(400).send("log in as url owner") }
    let templateVars = { url, user, urls: urlDatabase };
    res.render("urls_show", templateVars);
});
app.get("/u/:shortURL", (req, res) => {
    let id = req.params.shortURL;
    const index = urlDatabase.findIndex(url => url.shortURL === id);
    if (index === -1) { res.status(400).send("invalid entry") }
    let longURL = urlDatabase[index].longURL;
    res.redirect(longURL);
});
app.get("/register", (req, res) => {
    let user = undefined;
    if (req.session.user_id) {
        id = req.session.user_id
        user = users[id];
    }
    let templateVars = { user };
    res.render("urls_reg", templateVars);
})
app.get("/login", (req, res) => {
    let user = undefined;
    if (req.session.user_id) {
        id = req.session.user_id
        user = users[id];
    }
    console.log(users)
    let templateVars = { user }
    res.render("urls_login", templateVars)
})
app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});
app.post("/register", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = generateRandomString();
    let emailFound = false;
    for (user in users) {
        if (users[user].email === email) { emailFound = true; }
    }
    if (!email || !password || emailFound === true) {
        console.log('no email or password')
    }
    users[id] = { id, email, 'password': hashedPassword }
    res.session.user_id = id;
    res.redirect("/urls")
})
app.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    console.log(req.body)
    let match = {};
    let cookieV = '';
    if (!email || !password) {
        res.redirect("/login")
    }
    for (user in users) {
        if (users[user].email == email) {
            match = user;
            break;
        }
        console.log('not found')
    }
    const hashedPassword = users[match].password;
    console.log(users[match].id, hashedPassword)
    if (bcrypt.compareSync(password, hashedPassword)) { cookieV = users[match].id }
    else {
        console.log('password wrong')
    }
    res.session.user_id = cookieV;
    res.redirect("/urls")
})
app.post("/logout", (req, res) => {
    req.session.user_id = null
    res.redirect("/urls")
})
app.post("/urls", (req, res) => {
    let shortURL = generateRandomString()
    let longURL = req.body.longURL;
    let userID = req.session.user_id;
    const newUrl = { shortURL, longURL, userID }
    urlDatabase.push(newUrl)
    res.redirect("/urls");
});
app.post("/urls/:id", (req, res) => {
    const id = req.params.id;
    const { newLong } = req.body
    const index = urlDatabase.findIndex(url => url.shortURL === id)
    if (req.session.user_id !== urlDatabase[index].userID) { res.status(400).send('not permitted') }
    urlDatabase[index].longURL = newLong;
    console.log(urlDatabase)
    res.redirect("/urls")
})
app.post("/urls/:id/delete", (req, res) => {
    const id = req.params.id;
    const index = urlDatabase.findIndex(url => url.shortURL === id)
    if (req.session.user_id !== urlDatabase[index].userID) { res.status(400).send('not permitted') }
    urlDatabase.splice(index, 1);
    console.log(urlDatabase)
    res.redirect("/urls")
})
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});