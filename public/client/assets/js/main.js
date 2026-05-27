(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner(0);


    // Fixed Navbar
    $(window).scroll(function () {
        if ($(window).width() < 992) {
            if ($(this).scrollTop() > 55) {
                $('.fixed-top').addClass('shadow');
            } else {
                $('.fixed-top').removeClass('shadow');
            }
        } else {
            if ($(this).scrollTop() > 55) {
                $('.fixed-top').addClass('shadow').css('top', -55);
            } else {
                $('.fixed-top').removeClass('shadow').css('top', 0);
            }
        } 
    });
    
    
   // Back to top button
   $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
        $('.back-to-top').fadeIn('slow');
    } else {
        $('.back-to-top').fadeOut('slow');
    }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
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
        nav : true,
        navText : [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        responsiveClass: true,
        responsive: {
            0:{
                items:1
            },
            576:{
                items:1
            },
            768:{
                items:1
            },
            992:{
                items:2
            },
            1200:{
                items:2
            }
        }
    });


    // vegetable carousel
    $(".vegetable-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1500,
        center: false,
        dots: true,
        loop: true,
        margin: 25,
        nav : true,
        navText : [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        responsiveClass: true,
        responsive: {
            0:{
                items:1
            },
            576:{
                items:1
            },
            768:{
                items:2
            },
            992:{
                items:3
            },
            1200:{
                items:4
            }
        }
    });


    // Modal Video
    $(document).ready(function () {
        var $videoSrc;
        $('.btn-play').click(function () {
            $videoSrc = $(this).data("src");
        });
        console.log($videoSrc);

        $('#videoModal').on('shown.bs.modal', function (e) {
            $("#video").attr('src', $videoSrc + "?autoplay=1&amp;modestbranding=1&amp;showinfo=0");
        })

        $('#videoModal').on('hide.bs.modal', function (e) {
            $("#video").attr('src', $videoSrc);
        })
    });



    // Product Quantity
    $('.quantity button').on('click', function () {
        var button = $(this);
        var oldValue = button.parent().parent().find('input').val();
        if (button.hasClass('btn-plus')) {
            var newVal = parseFloat(oldValue) + 1;
        } else {
            if (oldValue > 0) {
                var newVal = parseFloat(oldValue) - 1;
            } else {
                newVal = 0;
            }
        }
        button.parent().parent().find('input').val(newVal);
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
            const inputField = formSearchClient.querySelector("input[name='keyword']");
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
                amountOutput.value = Number(priceMaxCurrent).toLocaleString("vi-VN") + " đ";
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
        listButtonPage.forEach(button => {
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
                                        const imgPath = (item.images && item.images.length > 0) ? (domainCDN + item.images[0]) : '';
                                        const priceNewHtml = item.priceNew ? `<div class="inner-price-new">${item.priceNew.toLocaleString("vi-VN")}đ</div>` : '';
                                        const priceOldHtml = item.priceOld ? `<div class="inner-price-old">${item.priceOld.toLocaleString("vi-VN")}đ</div>` : '';
                                        
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
                        document.querySelectorAll("[button-voice].listening").forEach(btn => {
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
                    input.placeholder = form.hasAttribute("form-search") ? "Tìm kiếm..." : "Nhập từ khóa...";
                };

                voice.onerror = (event) => {
                    console.error("Speech recognition error:", event.error);
                    buttonVoice.classList.remove("listening");
                    input.placeholder = form.hasAttribute("form-search") ? "Tìm kiếm..." : "Nhập từ khóa...";
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

})(jQuery);


