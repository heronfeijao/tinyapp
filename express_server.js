/* eslint-disable camelcase */
const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const morgan = require('morgan');
app.use(morgan('dev'));
app.use(methodOverride('_method'));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['lighthouse labs']
}));

// "DATABASES"
const urlDatabase = {
  "b2xVn3": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "hf1"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "hf1"
  },
};

const users = {
  "hf1": {
    id: "hf1",
    email: "user@example.com",
    password: bcrypt.hashSync('123', 10)
  },
};

// HELPER FUNCTIONS
const helperFuncs = require('./helpers');
const { getUserByEmail, generateRandomString, blankData, validPassword, urlsForUser } = helperFuncs(bcrypt, users);

// "HOMEPAGE" ------------------------------------------------------------------------------------------
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  res.redirect("/login");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// URLS LIST ------------------------------------------------------------------------------------------
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.session.user_id] };
  const userDatabase = urlsForUser(req.session.user_id, urlDatabase);
  templateVars['userDatabase'] = userDatabase;
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    return;
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect(`/urls/${shortURL}`);
});

// CREATE PAGE ------------------------------------------------------------------------------------------
app.get("/urls/new", (req, res) => {
  const templateVars = { urls: urlDatabase, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.session.user_id] };
  if (!templateVars.user) {
    res.redirect("/login");
    return;
  }
  res.render("urls_new", templateVars);
});

// SHORT URL ------------------------------------------------------------------------------------------
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { urls: urlDatabase, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.session.user_id] };
  const user = req.session.user_id;
  if (!user) {
    res.redirect('/login');
    return;
  }
  const id = urlDatabase[req.params.shortURL].userID;
  if (user !== id) {
    res.statusCode = 400;
    res.send('Sorry. You cannot edit this URL ID');
    return;
  }
  res.render("urls_show", templateVars);
});

// SHORTURL LINK ------------------------------------------------------------------------------------------
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.statusCode = 400;
    res.send('Invalid URL id');
    return;
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// DELETE ------------------------------------------------------------------------------------------
app.delete("/urls/:id", (req, res) => {
  const user = req.session.user_id;
  if (!urlDatabase[req.params.id] || user !== urlDatabase[req.params.id].userID) {
    res.statusCode = 400;
    res.send('Sorry. You cannot delete this URL ID');
    return;
  }
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// EDIT ------------------------------------------------------------------------------------------
app.put("/urls/:id", (req, res) => {
  const user = req.session.user_id;
  if (!urlDatabase[req.params.id] || user !== urlDatabase[req.params.id].userID) {
    res.statusCode = 400;
    res.send('Sorry. You cannot edit this URL ID');
    return;
  }
  urlDatabase[req.params.id].longURL = req.body.editURL;
  res.redirect('/urls');
});

// LOGIN ------------------------------------------------------------------------------------------
app.get("/login", (req, res) => {
  const templateVars = { urls: urlDatabase, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.session.user_id] };
  const user = req.session.user_id;
  if (user) {
    res.redirect('/urls');
    return;
  }
  res.render('urls_login', templateVars);
});

app.post("/login", (req, res) => {
  const userId = getUserByEmail(req.body.email, users);
  if (!userId) {
    res.statusCode = 403;
    res.send('User not found');
    return;
  }
  if (!validPassword(users, req.body)) {
    res.statusCode = 403;
    res.send('Invalid password');
    return;
  }
  req.session.user_id = userId;
  res.redirect('/urls');
});

// LOGOUT ------------------------------------------------------------------------------------------
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// REGISTER ------------------------------------------------------------------------------------------
app.get('/register', (req, res) => {
  const templateVars = { urls: urlDatabase, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.session.user_id] };
  const user = req.session.user_id;
  if (user) {
    res.redirect('/urls');
    return;
  }
  res.render("urls_register", templateVars);
});

app.post('/register', (req, res) => {
  if (blankData(req.body)) {
    res.statusCode = 400;
    res.send('Email and/or password cannot be empty.');
    return;
  }
  if (getUserByEmail(req.body.email, users)) {
    res.statusCode = 400;
    res.send('Email already registered.');
    return;
  }
  const userId = generateRandomString();
  const { email, password } = req.body;
  const hashedPw = bcrypt.hashSync(password, 10);
  users[userId] = { id: userId, email: email, password: hashedPw };
  req.session.user_id = userId;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});