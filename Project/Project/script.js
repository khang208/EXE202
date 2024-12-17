const cartItems = [];

function addToCart(productName, productPrice) {
    cartItems.push({ name: productName, price: productPrice });
    updateCart();
}

function updateCart() {
    const cartList = document.getElementById('cart-items');
    cartList.innerHTML = '';

    cartItems.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.name} - $${item.price}`;
        cartList.appendChild(li);
    });
}

function checkout() {
    alert('Proceeding to checkout');
}
