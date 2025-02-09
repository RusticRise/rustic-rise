document.addEventListener("DOMContentLoaded", function() {
    let cart = [];
    let orderCounts = JSON.parse(localStorage.getItem("orderCounts")) || {};

    function addToCart(id, name, price, limit) {
        if (!orderCounts[id]) orderCounts[id] = 0;

        if (orderCounts[id] >= limit) {
            alert("This item has reached its order limit for the week.");
            return;
        }

        let item = cart.find(product => product.id === id);
        if (item) {
            item.quantity++;
        } else {
            cart.push({ id, name, price, quantity: 1, limit });
        }

        updateCartDisplay();
        updateButtonStates();
    }

    function updateButtonStates() {
        document.querySelectorAll(".add-to-cart").forEach(button => {
            let id = button.getAttribute("data-id");
            let limit = parseInt(button.getAttribute("data-limit"), 10);
            let currentCount = orderCounts[id] || 0;

            if (currentCount >= limit) {
                button.disabled = true;
                button.textContent = "At Order Limit";
            } else {
                button.disabled = false;
                button.textContent = "Add to Cart";
            }
        });

        document.getElementById("order-limit-note").style.display =
            Object.values(orderCounts).some(count => count >= 1) ? "block" : "none";
    }

    function updateCartDisplay() {
        let cartDiv = document.getElementById("cart");
        cartDiv.innerHTML = cart.length === 0 ? "<p>Your cart is empty.</p>" : "";

        let table = document.createElement("table");
        let total = 0;

        cart.forEach(item => {
            let row = document.createElement("tr");
            let subtotal = item.price * item.quantity;
            total += subtotal;

            row.innerHTML = `<td>${item.name}</td><td>$${item.price.toFixed(2)}</td><td>${item.quantity}</td><td>$${subtotal.toFixed(2)}</td>`;
            table.appendChild(row);
        });

        cartDiv.appendChild(table);
    }

    document.querySelectorAll(".add-to-cart").forEach(button => {
        button.addEventListener("click", function() {
            let id = this.getAttribute("data-id");
            let name = this.getAttribute("data-name");
            let price = parseFloat(this.getAttribute("data-price"));
            let limit = parseInt(this.getAttribute("data-limit"));

            addToCart(id, name, price, limit);
        });
    });

    document.getElementById("reset-orders").addEventListener("click", function() {
        localStorage.removeItem("orderCounts");
        alert("Weekly order limits have been reset!");
        location.reload();
    });

    updateButtonStates();
});
