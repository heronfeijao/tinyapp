/* eslint-disable func-style */
const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn3": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  },
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
};

app.get("/", (req, res) => {
  res.send('Hello!');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies['user_id']] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { urls: urlDatabase, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies['user_id']] };
  if (!templateVars.user) {
    res.redirect("/login");
    return;
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { urls: urlDatabase, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies['user_id']] };
  res.render("urls_show", templateVars);
});

// CREATE
app.post("/urls", (req, res) => {
  const user = users[req.cookies['user_id']];
  if (!user) {
    res.redirect("/login");
    return;
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.cookies['user_id']};
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.statusCode = 400;
    res.send('Invalid URL id');
    return;
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// DELETE
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// EDIT
app.post("/urls/:id/edit", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.editURL;
  res.redirect('/urls');
});

// LOGIN
app.get("/login", (req, res) => {
  const templateVars = { urls: urlDatabase, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies['user_id']] };
  res.render('urls_login', templateVars);
});

app.post("/login", (req, res) => {
  const userId = existingEmail(users, req.body);
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
  res.cookie('user_id', userId);
  res.redirect('/urls');
});

// LOGOUT
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// REGISTER (GET)
app.get('/register', (req, res) => {
  const templateVars = { urls: urlDatabase, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies['user_id']] };
  res.render("urls_register", templateVars);
});

app.post('/register', (req, res) => {
  const userId = generateRandomString();
  if (blankData(req.body)) {
    res.statusCode = 400;
    res.send('Email and/or password cannot be empty.');
    return;
  }
  if (existingEmail(users, req.body)) {
    res.statusCode = 400;
    res.send('Email already registered.');
    return;
  }
  const email = req.body.email;
  const password = req.body.password;
  users[userId] = { id: userId, email: email, password: password };
  res.cookie('user_id', userId);
  res.redirect('/urls');
});

function generateRandomString() {
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  const length = 6;
  for (let i = length; i > 0; --i) {
    result += characters[Math.round(Math.random() * (characters.length - 1))];
  }
  return result;
}

function blankData(resp) {
  if (resp.email === '' || resp.password === '') {
    return true;
  }
  return false;
}

function existingEmail(database, resp) {
  for (let user in database) {
    if (database[user].email === resp.email) {
      return database[user].id;
    }
  }
  return false;
}

function validPassword(database, resp) {
  for (let user in database) {
    if (database[user].password === resp.password) {
      return true;
    }
  }
  return false;
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});