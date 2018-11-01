var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
app.set('view engine', 'ejs');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const cookieParser = require("cookie-parser");
app.use(cookieParser());
var urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
};
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
app.get("/", (req, res) => {
    res.send("Hello!");
});
app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});
app.get("/urls", (req, res) => {
    let user = {};
    if (req.cookies["user_id"]) {
        id = req.cookies["user_id"]
        user = users[id];
    }
    console.log(user)
    let templateVars = { urls: urlDatabase, user };
    res.render("urls_index", templateVars);
});
app.get("/urls/new", (req, res) => {
    res.render("urls_new");
});
app.get("/urls/:id", (req, res) => {
    let templateVars = { shortURL: req.params.id, longURL: urlDatabase, id: req.cookies["user_id"] };
    res.render("urls_show", templateVars);
});
app.get("/u/:shortURL", (req, res) => {
    let shortURL = req.params.shortURL;
    let longURL = urlDatabase[shortURL];
    res.redirect(longURL);
});
app.get("/register", (req, res) => {
    let templateVars = {id: req.cookies["user_id"]} ;
    res.render("urls_reg", templateVars);
})
app.get("/login", (req, res) => {
    let user = undefined;
    if (req.cookies["user_id"]) {
        id = req.cookies["user_id"]
        user = users[id];
    }
    let templateVars = {user}
    res.render("urls_login", templateVars)
})
app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});
app.post("/register", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const id = generateRandomString();
    let emailFound = false;
    for (user in users) {
        if (users[user].email === email) {emailFound = true;}
    }
    if (!email || !password || emailFound === true) {
        res.status(404).send('Not found')
    }
    users[id] = {id, email, password}
    res.cookie('user_id', id)
    res.redirect("/urls")
})
app.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    let match = {};
    let cookieV = '';
    for (user in users) {
        if (users[user].email === email) {
            match = user;
        }
    }
    if (users[match].password === password) {cookieV = users[match].id}
    else {res.status(403).send('incorrect credentials')}
    res.cookie('user_id', cookieV)
    res.redirect("/urls")
})
app.post("/logout", (req, res) => {
    res.clearCookie('user_id')
    res.redirect("/urls")
})
app.post("/urls", (req, res) => {
    let shortURL = generateRandomString()
    urlDatabase[shortURL] = req.body.longURL;
    res.send("Ok");
});
app.post("/urls/:id", (req, res) => {
    const shortURL = req.params.id;
    const {newLong} = req.body
    urlDatabase[shortURL] = newLong;
    res.redirect("/urls")
})
app.get("/urls/:id/delete", (req, res) => {
    const id = req.params.id;
    delete urlDatabase[id];
    res.redirect("/urls")
})
app.post("/urls/:id/delete", (req, res) => {
    const id = req.params.id;
    delete urlDatabase[id]
    res.redirect("/urls")
})
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});