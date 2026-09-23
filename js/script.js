
// Анимация при скролле
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    
    if (scrollY < windowHeight) {
        const progress = scrollY / windowHeight;
        
        // Двигаем левое изображение влево
        document.querySelector('.image-left').style.transform = `translateX(-${progress * 100}%)`;
        
        // Исчезает центральное изображение
        document.querySelector('.image-center').style.opacity = 1 - progress;
        
        // Двигаем правое изображение вправо
        document.querySelector('.image-right').style.transform = `translateX(${progress * 100}%)`;
        
        // Появляется надпись
        document.querySelector('.title').style.opacity = progress;
    }
});

// Функции для навигации
function showProductPage() {
    document.querySelector('.product-page').style.display = 'block';
    window.scrollTo(0, 0);
}

function hideProductPage() {
    document.querySelector('.product-page').style.display = 'none';
}

function showCheckoutPage() {
    document.querySelector('.checkout-page').style.display = 'block';
    window.scrollTo(0, 0);
}

function hideCheckoutPage() {
    document.querySelector('.checkout-page').style.display = 'none';
}

// Галерея изображений на странице товара
let currentImageIndex = 0;

function changeImage(direction) {
    const images = document.querySelectorAll('.gallery-image');
    images[currentImageIndex].classList.remove('active');
    
    currentImageIndex += direction;
    
    if (currentImageIndex < 0) {
        currentImageIndex = images.length - 1;
    } else if (currentImageIndex >= images.length) {
        currentImageIndex = 0;
    }
    
    images[currentImageIndex].classList.add('active');
}

// Управление количеством товара
function changeQuantity(change) {
    const quantityElement = document.getElementById('quantity');
    let quantity = parseInt(quantityElement.textContent);
    
    quantity += change;
    
    if (quantity < 1) quantity = 1;
    
    quantityElement.textContent = quantity;
    updatePrices(quantity);
}

// Обновление цен
function updatePrices(quantity) {
    const itemPrice = 2500;
    const deliveryPrice = 400;
    const itemTotal = itemPrice * quantity;
    const totalPrice = itemTotal + deliveryPrice;
    
    document.getElementById('item-total').textContent = itemTotal + ' руб.';
    document.getElementById('total-price').textContent = totalPrice + ' руб.';
}

// Обработка заказа
function processOrder() {
    // Собираем данные из формы
    const form = document.getElementById('order-form');
    const formData = new FormData(form);
    
    const orderData = {
        email: formData.get('email'),
        lastName: formData.get('lastName'),
        firstName: formData.get('firstName'),
        middleName: formData.get('middleName'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        postalCode: formData.get('postalCode'),
        delivery: true,
        size: 'L',
        quantity: parseInt(document.getElementById('quantity').textContent),
        total: parseInt(document.getElementById('total-price').textContent.replace(' руб.', ''))
    };
    
    // Валидация формы
    if (!validateForm(orderData)) {
        return;
    }
    
    // Отправка данных на сервер
    fetch('/api/order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Ошибка: ' + data.error);
        } else {
            alert('Заказ оформлен! В ближайшее время с вами свяжутся для подтверждения.');
            // Очистка формы
            form.reset();
            hideCheckoutPage();
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз.');
    });
}

// Валидация формы
function validateForm(orderData) {
    // Проверка почтового индекса
    const postalCodeRegex = /^\d{6}$/;
    if (!postalCodeRegex.test(orderData.postalCode)) {
        alert('Пожалуйста, введите корректный почтовый индекс (6 цифр)');
        return false;
    }
    
    // Проверка email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderData.email)) {
        alert('Пожалуйста, введите корректный email адрес');
        return false;
    }
    
    return true;
}

// Очистка placeholder при фокусе
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input[placeholder]');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.setAttribute('data-placeholder', this.getAttribute('placeholder'));
            this.setAttribute('placeholder', '');
        });
        
        input.addEventListener('blur', function() {
            if (this.value === '') {
                this.setAttribute('placeholder', this.getAttribute('data-placeholder'));
            }
        });
    });
    
    // Обработчик клика на главное изображение товара
    document.getElementById('main-product-image').addEventListener('click', showProductPage);
});

