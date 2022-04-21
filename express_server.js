/* eslint-disable func-style */
const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

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

app.get("/", (req, res) => {
  res.send('Hello!');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies['user_id']] };
  const userDatabase = urlsForUser(req.cookies['user_id'], urlDatabase);
  templateVars['userDatabase'] = userDatabase;
  res.render("urls_index", templateVars);
});

// CREATE PAGE
app.get("/urls/new", (req, res) => {
  const templateVars = { urls: urlDatabase, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies['user_id']] };
  if (!templateVars.user) {
    res.redirect("/login");
    return;
  }
  res.render("urls_new", templateVars);
});

// SHORT URL
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
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.cookies['user_id'] };
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
  const user = req.cookies['user_id'];
  if (!urlDatabase[req.params.id] || user !== urlDatabase[req.params.id].userID) {
    res.statusCode = 400;
    res.send('Sorry. You cannot delete this URL ID');
    return;
  }
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// EDIT
app.post("/urls/:id/edit", (req, res) => {
  const user = req.cookies['user_id'];
  if (!urlDatabase[req.params.id] || user !== urlDatabase[req.params.id].userID) {
    res.statusCode = 400;
    res.send('Sorry. You cannot edit this URL ID');
    return;
  }
  urlDatabase[req.params.id].longURL = req.body.editURL;
  res.redirect('/urls');
});

// LOGIN (GET)
app.get("/login", (req, res) => {
  const templateVars = { urls: urlDatabase, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies['user_id']] };
  res.render('urls_login', templateVars);
});

// LOGIN (POST)
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

// REGISTER (POST)
app.post('/register', (req, res) => {
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
  const userId = generateRandomString();
  const { email, password } = req.body;
  const hashedPw = bcrypt.hashSync(password, 10);
  users[userId] = { id: userId, email: email, password: hashedPw };
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
  for (const user in database) {
    if (database[user].email === resp.email) {
      return database[user].id;
    }
  }
  return false;
}

function validPassword(database, resp) {
  for (const user in database) {
    if (bcrypt.compareSync(resp.password, database[user].password)) {
      return true;
    }
  }
  return false;
}

function urlsForUser(id, database) {
  let userURLs = {};
  for (const userId in database) {
    if (database[userId].userID === id) {
      userURLs[userId] = database[userId].longURL;
    }
  }
  return userURLs;
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});