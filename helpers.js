const helperFuncs = (bcrypt) => {

  const getUserByEmail = (email, database) => {
    for (const user in database) {
      if (database[user].email === email) {
        return database[user].id;
      }
    }
    return;
  };

  const generateRandomString = () => {
    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    const length = 6;
    for (let i = length; i > 0; --i) {
      result += characters[Math.round(Math.random() * (characters.length - 1))];
    }
    return result;
  };

  const blankData = (resp) => {
    if (resp.email === '' || resp.password === '') {
      return true;
    }
    return false;
  };

  const validPassword = (database, resp) => {
    for (const user in database) {
      if (bcrypt.compareSync(resp.password, database[user].password)) {
        return true;
      }
    }
    return false;
  };

  const urlsForUser = (id, database) => {
    let userURLs = {};
    for (const userId in database) {
      if (database[userId].userID === id) {
        userURLs[userId] = database[userId].longURL;
      }
    }
    return userURLs;
  };

  return {getUserByEmail, generateRandomString, blankData, validPassword, urlsForUser };
};

module.exports = helperFuncs;