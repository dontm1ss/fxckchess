const ITEM_PRICE = 2500;
const DELIVERY_PRICE = 400;
const MAX_QUANTITY = 20;

function formatPrice(value) {
    return value.toLocaleString('ru-RU') + ' ₽';
}

function getQuantity() {
    return parseInt(document.getElementById('quantity').textContent, 10) || 1;
}

function changeQuantity(change) {
    const quantity = Math.min(MAX_QUANTITY, Math.max(1, getQuantity() + change));
    document.getElementById('quantity').textContent = quantity;
    updatePrices(quantity);
}

function updatePrices(quantity) {
    const itemTotal = ITEM_PRICE * quantity;
    document.getElementById('item-total').textContent = formatPrice(itemTotal);
    document.getElementById('total-price').textContent = formatPrice(itemTotal + DELIVERY_PRICE);
}

function setStatus(type, message) {
    const status = document.getElementById('form-status');
    status.className = 'form-status' + (type ? ' is-' + type : '');
    status.textContent = message || '';
}

// Проверка полей: подсвечиваем неверные и возвращаем текст первой ошибки
function validateForm(form) {
    const messages = {
        email: 'Введите корректный email',
        phone: 'Введите номер телефона',
        lastName: 'Введите фамилию',
        firstName: 'Введите имя',
        address: 'Введите адрес доставки',
        postalCode: 'Почтовый индекс — 6 цифр'
    };
    let firstError = null;

    form.querySelectorAll('input:not([type=checkbox])').forEach(function(input) {
        input.value = input.value.trim();
        let valid = input.checkValidity();
        if (input.name === 'email') valid = valid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
        if (input.name === 'phone') valid = valid && input.value.replace(/\D/g, '').length >= 10;
        input.classList.toggle('is-invalid', !valid);
        if (!valid && !firstError) firstError = input;
    });

    const consent = document.getElementById('consent');
    consent.parentElement.classList.toggle('is-invalid', !consent.checked);
    if (!firstError && !consent.checked) {
        consent.focus();
        return 'Подтвердите согласие с офертой и политикой конфиденциальности';
    }

    if (firstError) {
        firstError.focus();
        return messages[firstError.name] || 'Проверьте поля формы';
    }
    return null;
}

function processOrder(e) {
    e.preventDefault();
    const form = document.getElementById('order-form');
    const button = document.getElementById('checkout-button');

    const error = validateForm(form);
    if (error) {
        setStatus('error', error);
        return;
    }

    const formData = new FormData(form);
    const quantity = getQuantity();
    const orderData = {
        email: formData.get('email'),
        lastName: formData.get('lastName'),
        firstName: formData.get('firstName'),
        middleName: formData.get('middleName'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        postalCode: formData.get('postalCode'),
        delivery: true,
        size: 'Оверсайз',
        quantity: quantity,
        total: ITEM_PRICE * quantity + DELIVERY_PRICE
    };

    button.disabled = true;
    button.textContent = 'Отправляем…';
    setStatus(null);

    fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.error) {
            setStatus('error', 'Ошибка: ' + data.error);
        } else {
            setStatus('success', 'Заказ оформлен! Скоро свяжемся с вами для подтверждения — проверьте почту (и «Спам»).');
            form.reset();
        }
    })
    .catch(function(err) {
        console.error('Ошибка:', err);
        setStatus('error', 'Не получилось отправить заказ. Попробуйте ещё раз или напишите на alwaystiltedstore@gmail.com');
    })
    .finally(function() {
        button.disabled = false;
        button.textContent = 'Оформить заказ';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('decrease-quantity').addEventListener('click', function() { changeQuantity(-1); });
    document.getElementById('increase-quantity').addEventListener('click', function() { changeQuantity(1); });
    document.getElementById('order-form').addEventListener('submit', processOrder);

    // Снимаем красную подсветку, как только поле начали править
    document.querySelectorAll('#order-form input').forEach(function(input) {
        input.addEventListener('input', function() { input.classList.remove('is-invalid'); });
    });
    document.getElementById('consent').addEventListener('change', function() {
        this.parentElement.classList.remove('is-invalid');
    });
    document.getElementById('postalCode').addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').slice(0, 6);
    });

    const year = document.querySelector('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
});
