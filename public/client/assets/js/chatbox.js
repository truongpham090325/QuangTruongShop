document.addEventListener("DOMContentLoaded", () => {
  const chatBtn = document.getElementById("aiChatBtn");
  const chatWindow = document.getElementById("aiChatWindow");
  const chatClose = document.getElementById("aiChatClose");
  const chatForm = document.getElementById("aiChatForm");
  const chatInput = document.getElementById("aiChatInput");
  const chatMessages = document.getElementById("aiChatMessages");
  const suggestionChips = document.querySelectorAll(".suggestion-chip");
  const dotBadge = chatBtn ? chatBtn.querySelector(".badge-dot") : null;

  if (!chatBtn || !chatWindow) return;

  let isInitialized = false;

  // Toggle Chat window
  chatBtn.addEventListener("click", (e) => {
    e.preventDefault();
    chatWindow.classList.toggle("show");
    
    // Hide the notification dot when opened
    if (dotBadge) {
      dotBadge.style.display = "none";
    }

    // Scroll to bottom when opening
    scrollToBottom();

    // Send greeting on first open
    if (!isInitialized) {
      isInitialized = true;
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        addMessage(
          "Chào bạn! 👋 Mình là Trợ lý AI của Quang Trường Shop. Mình có thể giúp bạn tìm kiếm trái cây sạch, hoa quả nhập khẩu tươi ngon hoặc muối chấm đậm vị. Bạn cần tư vấn gì hôm nay ạ?",
          "bot"
        );
      }, 800);
    }
  });

  // Close Chat
  if (chatClose) {
    chatClose.addEventListener("click", () => {
      chatWindow.classList.remove("show");
    });
  }

  // Suggestion chips
  suggestionChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const text = chip.getAttribute("data-msg") || chip.textContent.trim();
      sendMessage(text);
    });
  });

  // Form submit
  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      sendMessage(text);
    });
  }

  // Send message function
  function sendMessage(text) {
    // Add user message
    addMessage(text, "user");
    if (chatInput) chatInput.value = "";

    // Show typing indicator
    showTypingIndicator();
    scrollToBottom();

    // Call API
    fetch("/chat/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: text }),
    })
      .then((res) => res.json())
      .then((data) => {
        hideTypingIndicator();

        if (data.code === "success") {
          addMessage(data.reply, "bot");
          
          if (data.products && data.products.length > 0) {
            addProductRecommendations(data.products);
          }
        } else {
          addMessage("Rất tiếc, đã có lỗi xảy ra. Hãy thử lại sau nhé!", "bot");
        }
        scrollToBottom();
      })
      .catch((err) => {
        console.error("Chat API error:", err);
        hideTypingIndicator();
        addMessage("Kết nối của bạn đang gặp gián đoạn. Xin vui lòng thử lại sau!", "bot");
        scrollToBottom();
      });
  }

  // Add message bubble
  function addMessage(text, sender) {
    const bubble = document.createElement("div");
    bubble.classList.add("chat-msg", sender);
    bubble.textContent = text;
    chatMessages.appendChild(bubble);
    scrollToBottom();
  }

  // Add product cards to chat
  function addProductRecommendations(products) {
    const container = document.createElement("div");
    container.classList.add("chat-products-container");

    products.forEach((prod) => {
      const imgUrl = prod.images && prod.images.length > 0 
        ? `${domainCDN}${prod.images[0]}` 
        : "/client/assets/img/single-item.jpg";
      
      const priceNewFormatted = prod.priceNew 
        ? prod.priceNew.toLocaleString("vi-VN") + "đ" 
        : "Liên hệ";
      
      const priceOldFormatted = prod.priceOld && prod.priceOld > prod.priceNew
        ? prod.priceOld.toLocaleString("vi-VN") + "đ"
        : "";

      const card = document.createElement("div");
      card.classList.add("chat-product-card");
      card.innerHTML = `
        <img class="chat-product-img" src="${imgUrl}" alt="${prod.name}">
        <div class="chat-product-info">
          <div>
            <a class="chat-product-name" href="/product/detail/${prod.slug}" target="_blank">${prod.name}</a>
            <div class="chat-product-price-row">
              <span class="chat-product-price">${priceNewFormatted}</span>
              ${priceOldFormatted ? `<span class="chat-product-price-old">${priceOldFormatted}</span>` : ""}
            </div>
          </div>
          <div class="chat-product-actions">
            <a class="chat-btn-detail" href="/product/detail/${prod.slug}" target="_blank">Xem</a>
            <button class="chat-btn-add" data-id="${prod._id || prod.id}">+ Giỏ hàng</button>
          </div>
        </div>
      `;

      // Bind direct add to cart logic
      const addBtn = card.querySelector(".chat-btn-add");
      addBtn.addEventListener("click", () => {
        addToCart(prod._id || prod.id);
      });

      container.appendChild(card);
    });

    chatMessages.appendChild(container);
    scrollToBottom();
  }

  // Direct add to cart
  function addToCart(productId) {
    if (!productId) return;
    
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existItem = cart.find((item) => item.productId === productId);

    if (existItem) {
      existItem.quantity += 1;
    } else {
      cart.unshift({
        productId: productId,
        quantity: 1,
        checked: true,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    // Update cart counts in header/navbar
    document.querySelectorAll("[mini-cart-quantity]").forEach((item) => {
      item.innerHTML = cart.length;
    });

    // Notify user using Notyf
    if (typeof notyf !== "undefined") {
      notyf.success("Đã thêm vào giỏ hàng!");
    } else {
      alert("Đã thêm sản phẩm vào giỏ hàng thành công!");
    }
  }

  // Scroll messages list to bottom
  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Typing indicator helpers
  function showTypingIndicator() {
    // Check if indicator already exists
    if (document.getElementById("chatTypingIndicator")) return;

    const indicator = document.createElement("div");
    indicator.id = "chatTypingIndicator";
    indicator.classList.add("chat-msg", "bot", "typing-indicator");
    indicator.innerHTML = `
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    `;
    chatMessages.appendChild(indicator);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const indicator = document.getElementById("chatTypingIndicator");
    if (indicator) {
      indicator.remove();
    }
  }
});
