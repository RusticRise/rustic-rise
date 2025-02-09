document.addEventListener("DOMContentLoaded", function() {
  // ----------------------------
  // Shopping Cart Code
  // ----------------------------

  // Global array to hold cart items
  var cart = [];

// Retrieve order counts from localStorage
var orderCounts = JSON.parse(localStorage.getItem("orderCounts")) || {};

window.addToCart = function(id, name, price, limit) {
  // Ensure order count is tracked
  if (!orderCounts[id]) {
    orderCounts[id] = 0;
  }

  // Check if the item has reached the weekly limit
  if (orderCounts[id] >= limit) {
    alert("This item has reached its order limit for the week.");
    return;
  }

  // Add to cart and update order count
  var item = cart.find(product => product.id === id);
  if (item) {
    item.quantity++;
  } else {
    cart.push({ id: id, name: name, price: price, quantity: 1, limit: limit });
  }

  orderCounts[id]++; // Increase the order count
  localStorage.setItem("orderCounts", JSON.stringify(orderCounts)); // Save to localStorage

  updateCartDisplay();
  updateButtonStates(); // Disable buttons if limits are reached
};

// Function to disable "Add to Cart" buttons when the limit is reached
function updateButtonStates() {
  var allButtons = document.querySelectorAll(".product button");
  var limitNote = document.getElementById("order-limit-note");
  var limitReached = false;

  allButtons.forEach(button => {
    var id = button.getAttribute("onclick").match(/\d+/)[0]; // Extract product ID
    var limit = parseInt(button.getAttribute("data-limit"), 10); // Get limit as a number
    var currentCount = orderCounts[id] ? orderCounts[id] : 0; // Get current count from localStorage

    if (currentCount >= limit) {
      button.disabled = true;
      button.textContent = "At Order Limit";
      button.style.backgroundColor = "#ccc";
      button.style.cursor = "not-allowed";
      limitReached = true; // At least one item is sold out
    } else {
      button.disabled = false;
      button.textContent = "Add to Cart"; // Restore button if limit isn't reached
      button.style.backgroundColor = "#8B5E3B";
      button.style.cursor = "pointer";
    }
  });

  // Show the order limit note only if at least one product has reached its limit
  if (limitReached) {
    limitNote.style.display = "block";
  } else {
    limitNote.style.display = "none";
  }
}

// Ensure the function runs on page load and also after adding an item
document.addEventListener("DOMContentLoaded", function () {
  updateButtonStates(); // Check limits when the page loads
});



  // Update the cart display in the DOM
	function updateCartDisplay() {
	  var cartDiv = document.getElementById("cart");
	  var refreshNote = document.querySelector(".cart-refresh-note");
	  cartDiv.innerHTML = "";

	  if (cart.length === 0) {
		cartDiv.innerHTML = "<p>Your cart is empty.</p>";
		if (refreshNote) {
		  refreshNote.style.display = "none"; // Hide the refresh note when the cart is empty
		}
		return;
	  }

	  if (refreshNote) {
		refreshNote.style.display = "block"; // Show the note when items are added
	  }

	  var table = document.createElement("table");
	  var headerRow = document.createElement("tr");
	  headerRow.innerHTML = "<th>Product</th><th>Price</th><th>Quantity</th><th>Subtotal</th>";
	  table.appendChild(headerRow);

	  var total = 0;
	  cart.forEach(function(item) {
		var row = document.createElement("tr");
		var subtotal = item.price * item.quantity;
		total += subtotal;
		row.innerHTML = "<td>" + item.name + "</td>" +
						"<td>$" + item.price.toFixed(2) + "</td>" +
						"<td>" + item.quantity + "</td>" +
						"<td>$" + subtotal.toFixed(2) + "</td>";
		table.appendChild(row);
	  });

	  var totalRow = document.createElement("tr");
	  totalRow.innerHTML = "<td colspan='3'><strong>Total</strong></td>" +
						   "<td><strong>$" + total.toFixed(2) + "</strong></td>";
	  table.appendChild(totalRow);

	  cartDiv.appendChild(table);
	}


  // ----------------------------
  // Pickup Date Calculation
  // ----------------------------
  // Business Rule:
  // • Orders placed on Monday (businessDay=1), Tuesday (2), or Wednesday (3) before 8pm
  //   get pickup on the upcoming Friday (day 5).
  // • All other orders get pickup on next week’s Friday.
  // For the purpose of this rule, treat Sunday (getDay() 0) as business day 7.
  function getPickupDate() {
    var now = new Date();
    var day = now.getDay();
    var businessDay = (day === 0 ? 7 : day);
    var hour = now.getHours();
    var diff;
    if ((businessDay === 1 || businessDay === 2) || (businessDay === 3 && hour < 20)) {
      // Same-week Friday: difference = 5 - businessDay
      diff = 5 - businessDay;
    } else {
      // Next-week Friday: difference = (5 + 7) - businessDay
      diff = (5 + 7) - businessDay;
    }
    var pickup = new Date(now);
    pickup.setDate(now.getDate() + diff);
    pickup.setHours(0,0,0,0);
    return pickup;
  }

  // ----------------------------
  // Checkout Process Code
  // ----------------------------

  // When "Place Order" is clicked, first update the pickup-info element then show the modal
  document.getElementById('place-order').addEventListener('click', function() {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    var pickupDate = getPickupDate();
    var formattedPickup = pickupDate.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
    var pickupInfoElem = document.getElementById('pickup-info');
    if (pickupInfoElem) {
      pickupInfoElem.textContent = "Pickup Date: " + formattedPickup;
    }
    document.getElementById('checkout-modal').style.display = 'block';
  });

  // Hide the modal when the close icon (×) is clicked
  document.querySelector('.modal .close').addEventListener('click', function() {
    document.getElementById('checkout-modal').style.display = 'none';
  });

  // Process the checkout form submission
  document.getElementById('checkout-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Retrieve customer information
    var firstName = document.getElementById('first-name').value.trim();
    var lastName = document.getElementById('last-name').value.trim();
    var phone = document.getElementById('phone').value.trim();
    var email = document.getElementById('email').value.trim();
    
    if (!firstName || !lastName) {
      alert("Please enter your first and last name.");
      return;
    }
    if (!phone && !email) {
      alert("Please provide at least a phone number or an email address.");
      return;
    }
    
    var paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    var orderId = generateOrderID();
    
    // Build order summary and include pickup date info
    var orderSummary = "Order ID: " + orderId + "\n";
    orderSummary += "Name: " + firstName + " " + lastName + "\n";
    if (phone) { orderSummary += "Phone: " + phone + "\n"; }
    if (email) { orderSummary += "Email: " + email + "\n"; }
    orderSummary += "Payment Method: " + paymentMethod + "\n";
    
    var pickupDate = getPickupDate();
    var formattedPickup = pickupDate.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
    orderSummary += "Pickup Date: " + formattedPickup + "\n\n";
    orderSummary += "Your Order Details:\n";
    
    cart.forEach(function(item) {
      orderSummary += item.quantity + " x " + item.name + " ($" + item.price.toFixed(2) + " each)\n";
    });
    
    var total = cart.reduce(function(sum, item) {
      return sum + (item.quantity * item.price);
    }, 0);
    orderSummary += "\nTotal: $" + total.toFixed(2) + "\n";
    
    if (paymentMethod === 'Venmo') {
      orderSummary += "\n** IMPORTANT: ** When sending your Venmo payment, please include your Order ID (" + orderId + ") as the payment description.";
    }
    
    // Create the order data object (includes customer info and pickup date)
    var orderData = {
      orderId: orderId,
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      email: email,
      paymentMethod: paymentMethod,
      orderDetails: orderSummary,
      total: total.toFixed(2)
    };
    
    // Send the order data to Google Sheets
    sendOrderData(orderData);
    
    // Replace the modal content with order confirmation details
    document.querySelector('.modal-content').innerHTML = "<h2>Order Confirmed!</h2><pre>" 
      + orderSummary + "</pre><button class='btn' id='close-confirmation'>Close</button>";
    
    // Clear the cart and update display
    cart = [];
    updateCartDisplay();
    
    document.getElementById('close-confirmation').addEventListener('click', function() {
      document.getElementById('checkout-modal').style.display = 'none';
      location.reload();
    });
  });

  // Generate a short unique Order ID (6-character alphanumeric)
  function generateOrderID() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let orderId = '';
    for (let i = 0; i < 6; i++) {
      orderId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'ORD-' + orderId;
  }

  // ----------------------------
  // Send Order Data to Google Sheets
  // ----------------------------
  const googleAppsScriptUrl = "https://script.google.com/macros/s/AKfycbxW9dnEotbZf5-vg-04_oxOHp7VIPdxMf1u7ze0IXTe0l7zTCTC8qvV3lRa3pgQwFGqmQ/exec";
  function sendOrderData(orderData) {
    fetch(googleAppsScriptUrl, {
      method: "POST",
      mode: "no-cors", // Use "no-cors" if necessary (response details won’t be available)
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderData)
    })
    .then(response => {
      console.log("Order data sent to Google Sheets.");
    })
    .catch(error => {
      console.error("Error sending order data:", error);
    });
  }
});
 
 // Function to clear the weekly order counts
function resetWeeklyOrders() {
  localStorage.removeItem("orderCounts"); // Clear the stored order totals
  alert("Weekly order limits have been reset!");
  location.reload(); // Refresh the page so buttons update
}

// Show reset button only if accessed by an admin (edit this condition if needed)
document.addEventListener("DOMContentLoaded", function () {
  var resetButton = document.getElementById("reset-orders");

  // Simple condition: Only show if accessed on a specific device (customize as needed)
  if (window.location.href.includes("admin")) { 
    resetButton.style.display = "block"; // Show the button
  }

  resetButton.addEventListener("click", resetWeeklyOrders);
});
