(function ($) {
  "use strict";

  // Spinner
  var spinner = function () {
    setTimeout(function () {
      if ($("#spinner").length > 0) {
        $("#spinner").removeClass("show");
      }
    }, 1);
  };
  spinner(0);

  // Fixed Navbar
  $(window).scroll(function () {
    if ($(window).width() < 992) {
      if ($(this).scrollTop() > 55) {
        $(".fixed-top").addClass("shadow");
      } else {
        $(".fixed-top").removeClass("shadow");
      }
    } else {
      if ($(this).scrollTop() > 55) {
        $(".fixed-top").addClass("shadow").css("top", -55);
      } else {
        $(".fixed-top").removeClass("shadow").css("top", 0);
      }
    }
  });

  // Back to top button
  $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
      $(".back-to-top").fadeIn("slow");
    } else {
      $(".back-to-top").fadeOut("slow");
    }
  });
  $(".back-to-top").click(function () {
    $("html, body").animate({ scrollTop: 0 }, 1500, "easeInOutExpo");
    return false;
  });

  // Testimonial carousel
  $(".testimonial-carousel").owlCarousel({
    autoplay: true,
    smartSpeed: 2000,
    center: false,
    dots: true,
    loop: true,
    margin: 25,
    nav: true,
    navText: [
      '<i class="bi bi-arrow-left"></i>',
      '<i class="bi bi-arrow-right"></i>',
    ],
    responsiveClass: true,
    responsive: {
      0: {
        items: 1,
      },
      576: {
        items: 1,
      },
      768: {
        items: 1,
      },
      992: {
        items: 2,
      },
      1200: {
        items: 2,
      },
    },
  });

  // vegetable carousel
  $(".vegetable-carousel").owlCarousel({
    autoplay: true,
    smartSpeed: 1500,
    center: false,
    dots: true,
    loop: true,
    margin: 25,
    nav: true,
    navText: [
      '<i class="bi bi-arrow-left"></i>',
      '<i class="bi bi-arrow-right"></i>',
    ],
    responsiveClass: true,
    responsive: {
      0: {
        items: 1,
      },
      576: {
        items: 1,
      },
      768: {
        items: 2,
      },
      992: {
        items: 3,
      },
      1200: {
        items: 4,
      },
    },
  });

  // Modal Video
  $(document).ready(function () {
    var $videoSrc;
    $(".btn-play").click(function () {
      $videoSrc = $(this).data("src");
    });
    console.log($videoSrc);

    $("#videoModal").on("shown.bs.modal", function (e) {
      $("#video").attr(
        "src",
        $videoSrc + "?autoplay=1&amp;modestbranding=1&amp;showinfo=0",
      );
    });

    $("#videoModal").on("hide.bs.modal", function (e) {
      $("#video").attr("src", $videoSrc);
    });
  });

  // Product Quantity
  $(".quantity button").on("click", function () {
    var button = $(this);
    var oldValue = button.parent().parent().find("input").val();
    if (button.hasClass("btn-plus")) {
      var newVal = parseFloat(oldValue) + 1;
    } else {
      if (oldValue > 0) {
        var newVal = parseFloat(oldValue) - 1;
      } else {
        newVal = 0;
      }
    }
    button.parent().parent().find("input").val(newVal);
  });

  // Client Product Search List Page
  const formSearchClient = document.querySelector("[form-search]");
  if (formSearchClient) {
    const url = new URL(window.location.href);

    formSearchClient.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = event.target.keyword.value.trim();
      if (value) {
        url.searchParams.set("keyword", value);
      } else {
        url.searchParams.delete("keyword");
      }
      url.searchParams.delete("page");
      window.location.href = url.href;
    });

    // Pre-populate keyword
    const currentKeyword = url.searchParams.get("keyword");
    if (currentKeyword) {
      const inputField = formSearchClient.querySelector(
        "input[name='keyword']",
      );
      if (inputField) {
        inputField.value = currentKeyword;
      }
    }
  }

  // Client Price Range Filter
  const rangeInput = document.querySelector("#rangeInput");
  const amountOutput = document.querySelector("#amount");
  if (rangeInput) {
    const url = new URL(window.location.href);

    rangeInput.addEventListener("change", () => {
      const value = rangeInput.value;
      // Nếu value là 1000000 (mức giá tối đa), xóa bộ lọc
      if (value && value !== "1000000") {
        url.searchParams.set("priceMax", value);
      } else {
        url.searchParams.delete("priceMax");
      }
      url.searchParams.delete("page");
      window.location.href = url.href;
    });

    // Pre-populate price range filter
    const priceMaxCurrent = url.searchParams.get("priceMax");
    if (priceMaxCurrent) {
      rangeInput.value = priceMaxCurrent;
      if (amountOutput) {
        amountOutput.value =
          Number(priceMaxCurrent).toLocaleString("vi-VN") + " đ";
      }
    }
  }

  // Client Sort Select
  const sortSelect = document.querySelector("[sort-select]");
  if (sortSelect) {
    const url = new URL(window.location.href);

    sortSelect.addEventListener("change", () => {
      const value = sortSelect.value;
      if (value && value !== "position-desc") {
        url.searchParams.set("sort", value);
      } else {
        url.searchParams.delete("sort");
      }
      url.searchParams.delete("page");
      window.location.href = url.href;
    });

    // Pre-populate sort selection
    const sortCurrent = url.searchParams.get("sort");
    if (sortCurrent) {
      sortSelect.value = sortCurrent;
    }
  }

  // Client Pagination
  const listButtonPage = document.querySelectorAll("[button-page]");
  if (listButtonPage.length > 0) {
    const url = new URL(window.location.href);
    listButtonPage.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const page = button.getAttribute("button-page");
        if (page) {
          url.searchParams.set("page", page);
        } else {
          url.searchParams.delete("page");
        }
        window.location.href = url.href;
      });
    });
  }

  // Suggest search products in Header
  const formSearchProduct = document.querySelector("#searchModal form");
  if (formSearchProduct) {
    const input = formSearchProduct.querySelector("input[name='keyword']");
    const boxSuggest = formSearchProduct.querySelector(".inner-suggest");
    const boxSuggestList = formSearchProduct.querySelector(".inner-list");
    let timeout;

    if (input && boxSuggest && boxSuggestList) {
      input.addEventListener("input", () => {
        clearTimeout(timeout);

        timeout = setTimeout(() => {
          const keyword = input.value.trim();
          if (keyword) {
            fetch(`/product/suggest?keyword=${keyword}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.code == "success") {
                  const htmls = data.list.map((item) => {
                    const imgPath =
                      item.images && item.images.length > 0
                        ? domainCDN + item.images[0]
                        : "";
                    const priceNewHtml = item.priceNew
                      ? `<div class="inner-price-new">${item.priceNew.toLocaleString("vi-VN")}đ</div>`
                      : "";
                    const priceOldHtml = item.priceOld
                      ? `<div class="inner-price-old">${item.priceOld.toLocaleString("vi-VN")}đ</div>`
                      : "";

                    return `
                                            <a class="inner-item" href="/product/detail/${item.slug}">
                                                <img class="inner-image" src="${imgPath}">
                                                <div class="inner-info">
                                                    <div class="inner-name">
                                                        ${item.name}
                                                    </div>
                                                    <div class="inner-prices">
                                                        ${priceNewHtml}
                                                        ${priceOldHtml}
                                                    </div>
                                                </div>
                                            </a>
                                        `;
                  });

                  boxSuggestList.innerHTML = htmls.join("");
                  if (data.list.length > 0) {
                    boxSuggest.style.display = "block";
                  } else {
                    boxSuggest.style.display = "none";
                  }
                }
              })
              .catch((err) => {
                console.error(err);
                boxSuggest.style.display = "none";
              });
          } else {
            boxSuggest.style.display = "none";
          }
        }, 500);
      });

      // Close suggestion box when clicking outside the form
      document.addEventListener("click", (event) => {
        if (!formSearchProduct.contains(event.target)) {
          boxSuggest.style.display = "none";
        }
      });

      // Show suggestion box again on focus if search term is present and we have suggestions
      input.addEventListener("focus", () => {
        const keyword = input.value.trim();
        if (keyword && boxSuggestList.children.length > 0) {
          boxSuggest.style.display = "block";
        }
      });
    }
  }

  // Tìm kiếm bằng giọng nói
  const listButtonVoice = document.querySelectorAll("[button-voice]");
  if (listButtonVoice.length > 0) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      listButtonVoice.forEach((buttonVoice) => {
        const form = buttonVoice.closest("form");
        if (!form) return;

        const input = form.querySelector("input[name='keyword']");
        if (!input) return;

        const voice = new SpeechRecognition();
        voice.lang = "vi-VN";
        voice.interimResults = false;
        voice.maxAlternatives = 1;

        buttonVoice.addEventListener("click", () => {
          if (buttonVoice.classList.contains("listening")) {
            voice.stop();
          } else {
            // Dừng các tiến trình lắng nghe khác nếu có
            document
              .querySelectorAll("[button-voice].listening")
              .forEach((btn) => {
                btn.click();
              });
            voice.start();
          }
        });

        voice.onstart = () => {
          buttonVoice.classList.add("listening");
          input.placeholder = "Đang lắng nghe, hãy nói...";
          input.value = "";
        };

        voice.onspeechend = () => {
          voice.stop();
        };

        voice.onend = () => {
          buttonVoice.classList.remove("listening");
          input.placeholder = form.hasAttribute("form-search")
            ? "Tìm kiếm..."
            : "Nhập từ khóa...";
        };

        voice.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          buttonVoice.classList.remove("listening");
          input.placeholder = form.hasAttribute("form-search")
            ? "Tìm kiếm..."
            : "Nhập từ khóa...";
        };

        voice.onresult = (event) => {
          const value = event.results[0][0].transcript;
          if (value) {
            input.value = value;
            form.requestSubmit();
          }
        };
      });
    } else {
      // Ẩn nút giọng nói nếu trình duyệt không hỗ trợ
      listButtonVoice.forEach((btn) => {
        btn.style.display = "none";
      });
    }
  }

  // Khởi tạo thư viện Notyf
  var notyf = new Notyf({
    duration: 3000,
    position: { x: "right", y: "top" },
    dismissible: true,
  });

  // Khởi tạo giỏ hàng
  const existCart = JSON.parse(localStorage.getItem("cart"));
  if (!existCart) {
    localStorage.setItem("cart", JSON.stringify([]));
  }
  // Hết Khởi tạo giỏ hàng

  // mini-cart-quantity
  const miniCartQuantity = () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const listElementMiniCartQuantity = document.querySelectorAll(
      "[mini-cart-quantity]",
    );
    listElementMiniCartQuantity.forEach((item) => {
      item.innerHTML = cart.length;
    });
  };
  miniCartQuantity();
  // End mini-cart-quantity

  // Thêm vào giỏ hàng
  const buttonAddCart = document.querySelector("[button-add-cart]");
  if (buttonAddCart) {
    buttonAddCart.addEventListener("click", () => {
      const inputQuantity = document.querySelector(".input-quantity");
      const productId = buttonAddCart.getAttribute("product-id");
      const quantity = inputQuantity ? parseInt(inputQuantity.value) : 1;

      if (productId && quantity > 0) {
        const dataItem = {
          productId: productId,
          quantity: quantity,
          checked: true,
        };
        const cart = JSON.parse(localStorage.getItem("cart")) || [];

        // Tìm xem có sản phẩm trùng productId hay không
        const existItem = cart.find(
          (item) => item.productId === dataItem.productId,
        );

        if (existItem) {
          existItem.quantity += dataItem.quantity;
          notyf.success("Đã cập nhật số lượng trong giỏ hàng!");
        } else {
          cart.unshift(dataItem);
          notyf.success("Đã thêm vào giỏ hàng!");
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        miniCartQuantity();
      }
    });
  }

  // Vẽ giỏ hàng
  const drawCart = () => {
    const cartTable = document.querySelector("[cart-table]");
    if (!cartTable) return;

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length > 0) {
      fetch(`/cart/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cart: cart,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            localStorage.setItem("cart", JSON.stringify([]));
            renderEmptyCart();
            miniCartQuantity();
          }

          if (data.code == "success") {
            let subTotal = 0;
            let htmlCartTable = "";

            data.cart.forEach((item) => {
              const { detail } = item;
              const priceNew = detail.priceNew;
              const priceOld = detail.priceOld;
              const stock = detail.stock;

              // Tách đơn vị tính từ detail.description (ví dụ: Bưởi da xanh: 30.000đ/quả -> quả)
              let unit = "Kg";
              if (detail.description) {
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = detail.description;
                const text = tempDiv.textContent || tempDiv.innerText || "";
                const slashIndex = text.lastIndexOf("/");
                if (slashIndex !== -1) {
                  unit = text.substring(slashIndex + 1).trim();
                }
              }

              subTotal += priceNew * item.quantity;

              htmlCartTable += `
                                <tr cart-item product-id="${item.productId}">
                                    <th scope="row">
                                        <div class="d-flex align-items-center">
                                            <img class="img-fluid me-5 rounded-circle" alt="${detail.name}" style="width: 80px; height: 80px;" src="${domainCDN}${detail.images[0]}">
                                        </div>
                                    </th>
                                    <td>
                                        <p class="mb-0 mt-4">
                                            <a href="/product/detail/${detail.slug}">${detail.name}</a>
                                        </p>
                                    </td>
                                    <td>
                                        <p class="mb-0 mt-4">${priceNew.toLocaleString("vi-VN")}đ</p>
                                    </td>
                                    <td>
                                        <div class="input-group quantity mt-4" style="width: 100px;">
                                            <div class="input-group-btn">
                                                <button class="btn btn-sm btn-minus rounded-circle bg-light border minus">
                                                    <i class="fa fa-minus"></i>
                                                </button>
                                            </div>
                                            <input class="form-control form-control-sm text-center border-0" value="${item.quantity}" type="number" min="1" max="${stock}" readonly />
                                            <div class="input-group-btn">
                                                <button class="btn btn-sm btn-plus rounded-circle bg-light border plus">
                                                    <i class="fa fa-plus"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <p class="mb-0 mt-4">${(priceNew * item.quantity).toLocaleString("vi-VN")}đ</p>
                                    </td>
                                    <td>
                                        <p class="mb-0 mt-4">${unit}</p>
                                    </td>
                                    <td>
                                        <button class="btn btn-md rounded-circle bg-light border mt-4" button-remove-item>
                                            <i class="fa fa-times text-danger"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
            });

            cartTable.innerHTML = htmlCartTable;

            const listElementSubTotal =
              document.querySelectorAll("[sub-total]");
            listElementSubTotal.forEach((elementSubTotal) => {
              elementSubTotal.innerHTML =
                subTotal.toLocaleString("vi-VN") + "đ";
            });

            const elementDiscount = document.querySelector("[discount]");
            if (elementDiscount) {
              elementDiscount.innerHTML = "0đ";
            }

            const elementTotal = document.querySelector("[total]");
            if (elementTotal) {
              elementTotal.innerHTML = subTotal.toLocaleString("vi-VN") + "đ";
            }

            eventRemoveItemInCart();
            eventQuantityInCart();
          }
        });
    } else {
      renderEmptyCart();
    }
  };

  const renderEmptyCart = () => {
    const cartTable = document.querySelector("[cart-table]");
    if (cartTable) {
      cartTable.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5">
                        Giỏ hàng trống.
                    </td>
                </tr>
            `;
    }

    const listElementSubTotal = document.querySelectorAll("[sub-total]");
    listElementSubTotal.forEach((elementSubTotal) => {
      elementSubTotal.innerHTML = "0đ";
    });

    const elementDiscount = document.querySelector("[discount]");
    if (elementDiscount) {
      elementDiscount.innerHTML = "0đ";
    }

    const elementTotal = document.querySelector("[total]");
    if (elementTotal) {
      elementTotal.innerHTML = "0đ";
    }
  };

  const eventRemoveItemInCart = () => {
    const listButtonRemoveItem = document.querySelectorAll(
      "[button-remove-item]",
    );
    listButtonRemoveItem.forEach((button) => {
      button.addEventListener("click", () => {
        const item = button.closest("[cart-item]");
        const productId = item.getAttribute("product-id");

        let cart = JSON.parse(localStorage.getItem("cart"));
        cart = cart.filter((cartItem) => cartItem.productId !== productId);

        localStorage.setItem("cart", JSON.stringify(cart));
        drawCart();
        miniCartQuantity();
        notyf.success("Đã xóa sản phẩm khỏi giỏ hàng!");
      });
    });
  };

  const eventQuantityInCart = () => {
    const listBoxQuantity = document.querySelectorAll("[cart-table] .quantity");
    listBoxQuantity.forEach((box) => {
      const inputQuantity = box.querySelector("input");
      const buttonPlus = box.querySelector(".plus");
      const buttonMinus = box.querySelector(".minus");

      const item = box.closest("[cart-item]");
      const productId = item.getAttribute("product-id");

      // Tăng số lượng
      buttonPlus.addEventListener("click", () => {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const itemUpdate = cart.find(
          (cartItem) => cartItem.productId === productId,
        );
        if (itemUpdate) {
          const quantity = parseInt(inputQuantity.value);
          const max = parseInt(inputQuantity.getAttribute("max") || "9999");
          if (quantity < max) {
            inputQuantity.value = quantity + 1;
            itemUpdate.quantity = parseInt(inputQuantity.value);
            localStorage.setItem("cart", JSON.stringify(cart));
            drawCart();
          } else {
            notyf.error(`Chỉ còn tối đa ${max} sản phẩm!`);
          }
        }
      });

      // Giảm số lượng
      buttonMinus.addEventListener("click", () => {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const itemUpdate = cart.find(
          (cartItem) => cartItem.productId === productId,
        );
        if (itemUpdate) {
          const quantity = parseInt(inputQuantity.value);
          if (quantity > 1) {
            inputQuantity.value = quantity - 1;
            itemUpdate.quantity = parseInt(inputQuantity.value);
            localStorage.setItem("cart", JSON.stringify(cart));
            drawCart();
          }
        }
      });
    });
  };

  // Vẽ trang đặt hàng
  const drawCheckout = () => {
    const checkoutTable = document.querySelector("[checkout-table]");
    if (!checkoutTable) return;

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length > 0) {
      fetch(`/cart/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cart: cart,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            checkoutTable.innerHTML = `
              <tr>
                <td colspan="6" class="text-center py-5">
                  Không lấy được thông tin đặt hàng.
                </td>
              </tr>
            `;
          }

          if (data.code == "success") {
            let total = 0;
            let htmlCheckoutTable = "";

            data.cart.forEach((item) => {
              const { detail } = item;
              const priceNew = detail.priceNew;

              // Tách đơn vị tính từ detail.description (ví dụ: Bưởi da xanh: 30.000đ/quả -> quả)
              let unit = "Kg";
              if (detail.description) {
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = detail.description;
                const text = tempDiv.textContent || tempDiv.innerText || "";
                const slashIndex = text.lastIndexOf("/");
                if (slashIndex !== -1) {
                  unit = text.substring(slashIndex + 1).trim();
                }
              }

              total += priceNew * item.quantity;

              htmlCheckoutTable += `
                <tr>
                  <th scope="row">
                    <div class="d-flex align-items-center mt-2">
                      <img class="img-fluid rounded-circle" alt="${detail.name}" style="width: 90px; height: 90px;" src="${domainCDN}${detail.images[0]}">
                    </div>
                  </th>
                  <td class="py-5">
                    <a href="/product/detail/${detail.slug}">${detail.name}</a>
                  </td>
                  <td class="py-5">${priceNew.toLocaleString("vi-VN")}đ</td>
                  <td class="py-5">${item.quantity}</td>
                  <td class="py-5">${unit}</td>
                  <td class="py-5">${(priceNew * item.quantity).toLocaleString("vi-VN")}đ</td>
                </tr>
              `;
            });

            checkoutTable.innerHTML = htmlCheckoutTable;

            const elementDiscount = document.querySelector("[discount]");
            if (elementDiscount) {
              elementDiscount.innerHTML = "0đ";
            }

            const elementTotal = document.querySelector("[total]");
            if (elementTotal) {
              elementTotal.innerHTML = total.toLocaleString("vi-VN") + "đ";
            }
          }
        });
    } else {
      checkoutTable.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-5">
            Không có sản phẩm nào trong giỏ hàng để đặt hàng.
          </td>
        </tr>
      `;
      const elementTotal = document.querySelector("[total]");
      if (elementTotal) {
        elementTotal.innerHTML = "0đ";
      }
    }
  };

  // Draw cart on page load
  drawCart();
  // Draw checkout on page load
  drawCheckout();

  // Xử lý sự kiện click đặt hàng
  const buttonOrder = document.querySelector("[button-order]");
  if (buttonOrder) {
    buttonOrder.addEventListener("click", () => {
      const fullNameInput = document.querySelector('input[name="fullName"]');
      const phoneInput = document.querySelector('input[name="phone"]');
      const addressInput = document.querySelector('input[name="address"]');
      const emailInput = document.querySelector('input[name="email"]');

      const fullName = fullNameInput ? fullNameInput.value.trim() : "";
      const phone = phoneInput ? phoneInput.value.trim() : "";
      const address = addressInput ? addressInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";

      if (!fullName) {
        notyf.error("Vui lòng nhập họ tên!");
        return;
      }
      if (fullName.length < 5) {
        notyf.error("Họ tên phải có ít nhất 5 ký tự!");
        return;
      }
      if (!phone) {
        notyf.error("Vui lòng nhập số điện thoại!");
        return;
      }
      const phoneRegex =
        /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/;
      if (!phoneRegex.test(phone)) {
        notyf.error("Số điện thoại không đúng định dạng!");
        return;
      }
      if (!email) {
        notyf.error("Vui lòng nhập email!");
        return;
      }
      if (!address) {
        notyf.error("Vui lòng nhập địa chỉ!");
        return;
      }

      // Lấy phương thức thanh toán
      const inputPaymentMethodChecked = document.querySelector(
        'input[name="paymentMethod"]:checked',
      );
      const dataPaymentMethod = inputPaymentMethodChecked
        ? inputPaymentMethodChecked.value
        : "money";

      // Lấy giỏ hàng từ localStorage
      let dataCart = JSON.parse(localStorage.getItem("cart")) || [];
      dataCart = dataCart.filter((item) => {
        delete item.detail;
        return item.checked !== false;
      });

      if (dataCart.length === 0) {
        notyf.error("Giỏ hàng của bạn đang trống!");
        return;
      }

      const dataFinal = {
        fullName: fullName,
        phone: phone,
        email: email,
        address: address,
        items: dataCart,
        paymentMethod: dataPaymentMethod,
      };

      buttonOrder.disabled = true;
      buttonOrder.innerText = "Đang xử lý...";

      fetch(`/order/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataFinal),
      })
        .then((res) => res.json())
        .then((data) => {
          buttonOrder.disabled = false;
          buttonOrder.innerText = "Đặt hàng";

          if (data.code === "error") {
            notyf.error(data.message);
          }

          if (data.code === "success") {
            // Xóa sản phẩm khỏi giỏ hàng
            let cart = JSON.parse(localStorage.getItem("cart")) || [];
            cart = cart.filter((item) => item.checked === false);
            localStorage.setItem("cart", JSON.stringify(cart));

            notyf.success(data.message);

            setTimeout(() => {
              switch (dataPaymentMethod) {
                case "money":
                  window.location.href = `/order/success?orderCode=${data.orderCode}&phone=${data.phone}`;
                  break;
                case "zalopay":
                  window.location.href = `/order/payment-zalopay?orderCode=${data.orderCode}&phone=${data.phone}`;
                  break;
                default:
                  window.location.href = "/";
                  break;
              }
            }, 1000);
          }
        })
        .catch((err) => {
          console.error(err);
          buttonOrder.disabled = false;
          buttonOrder.innerText = "Đặt hàng";
          notyf.error("Có lỗi xảy ra khi gửi yêu cầu đặt hàng!");
        });
    });
  }
})(jQuery);
