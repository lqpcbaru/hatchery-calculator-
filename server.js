const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

const adminUser = { username: 'admin', password: 'akim12345' };

app.get('/login', (req, res) => {
    res.send('<form method="POST" action="/login">\n    Username: <input type="text" name="username"><br>\n    Password: <input type="password" name="password"><br>\n    <input type="submit" value="Login">\n</form>');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === adminUser.username && password === adminUser.password) {
        res.send('Login successful!');
    } else {
        res.send('Invalid username or password.');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
