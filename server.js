const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Настройка отправки почты для Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Проверка соединения с почтовым сервером
transporter.verify((error, success) => {
  if (error) {
    console.log('Ошибка подключения к почтовому серверу:', error);
  } else {
    console.log('Почтовый сервер готов к отправке сообщений');
  }
});

// Маршруты для страниц
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/product', (req, res) => {
  res.sendFile(path.join(__dirname, 'product.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'checkout.html'));
});

// Маршрут для обработки заказов
app.post('/api/order', (req, res) => {
  const raw = req.body || {};

  // Экранируем всё, что пришло от пользователя, — это уходит в HTML письма
  const escapeHtml = (value) => String(value ?? '').trim()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const quantity = Math.min(20, Math.max(1, parseInt(raw.quantity, 10) || 1));
  const orderData = {
    email: escapeHtml(raw.email),
    firstName: escapeHtml(raw.firstName),
    lastName: escapeHtml(raw.lastName),
    middleName: escapeHtml(raw.middleName),
    phone: escapeHtml(raw.phone),
    address: escapeHtml(raw.address),
    postalCode: escapeHtml(raw.postalCode),
    size: 'Оверсайз',
    delivery: true,
    quantity,
    // Сумму считаем на сервере, а не берём из браузера
    total: 2500 * quantity + 400
  };
  
  // Валидация данных
  if (!orderData.email || !orderData.firstName || !orderData.lastName || 
      !orderData.phone || !orderData.address || !orderData.postalCode) {
    return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
  }

  // Проверка формата почтового индекса
  const postalCodeRegex = /^\d{6}$/;
  if (!postalCodeRegex.test(orderData.postalCode)) {
    return res.status(400).json({ error: 'Неверный формат почтового индекса' });
  }

  // Отправка email с информацией о заказе
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: 'Новый заказ на футболку FXCKCHESS - Always Tilted',
    html: `
      <h2>Новый заказ в Always Tilted</h2>
      <p><strong>Имя:</strong> ${orderData.firstName}</p>
      <p><strong>Фамилия:</strong> ${orderData.lastName}</p>
      <p><strong>Отчество:</strong> ${orderData.middleName || 'Не указано'}</p>
      <p><strong>Email:</strong> ${orderData.email}</p>
      <p><strong>Телефон:</strong> ${orderData.phone}</p>
      <p><strong>Адрес:</strong> ${orderData.address}</p>
      <p><strong>Почтовый индекс:</strong> ${orderData.postalCode}</p>
      <p><strong>Размер:</strong> ${orderData.size}</p>
      <p><strong>Количество:</strong> ${orderData.quantity}</p>
      <p><strong>Доставка:</strong> ${orderData.delivery ? 'РФ - 400 руб.' : 'Не выбрана'}</p>
      <p><strong>Итоговая сумма:</strong> ${orderData.total} руб.</p>
      <p><strong>Дата заказа:</strong> ${new Date().toLocaleString('ru-RU')}</p>
    `
  };
  
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Ошибка отправки email:', error);
      res.status(500).json({ error: 'Ошибка при отправке заказа' });
    } else {
      console.log('Email отправлен: ' + info.response);
      res.status(200).json({ message: 'Заказ успешно оформлен' });
      
      // Дополнительное уведомление для клиента
      const clientMailOptions = {
        from: process.env.EMAIL_USER,
        to: orderData.email,
        subject: 'Ваш заказ в FXCKCHESS',
        html: `
          <h2>Спасибо за ваш заказ!</h2>
          <p>Мы получили ваш заказ на футболку FXCKCHESS.</p>
          <p>В ближайшее время с вами свяжется наш менеджер для подтверждения заказа.</p>
          <p>Номер вашего заказа: #${Date.now()}</p>
          <p>Если у вас возникли вопросы, свяжитесь с нами по почте ${process.env.EMAIL_USER}</p>
        `
      };
      
      transporter.sendMail(clientMailOptions);
    }
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Откройте http://localhost:${PORT} в браузере`);
});

