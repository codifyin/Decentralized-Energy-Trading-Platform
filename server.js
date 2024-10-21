// server.js

const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Обслуживание статических файлов из папки 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Маршруты для страниц
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/registration', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'registration.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
