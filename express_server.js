var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
app.set('view engine', 'ejs');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

var urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
};
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
    let templateVars = { urls: urlDatabase };
    res.render("urls_index", templateVars);
});
app.get("/urls/new", (req, res) => {
    res.render("urls_new");
});
app.get("/urls/:id", (req, res) => {
    let templateVars = { shortURL: req.params.id, longURL: urlDatabase };
    res.render("urls_show", templateVars);
});
app.get("/u/:shortURL", (req, res) => {
    let shortURL = req.params.shortURL;
    let longURL = urlDatabase[shortURL];
    res.redirect(longURL);
});
app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});
app.post("/urls", (req, res) => {
    let shortURL = generateRandomString()
    urlDatabase[shortURL] = req.body.longURL;
    res.send("Ok");         // Respond with 'Ok' (we will replace this)
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