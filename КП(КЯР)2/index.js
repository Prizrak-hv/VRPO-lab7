
(function () {
  "use strict";

  const CURRENCY_LOCALE = "be-BY";
  const CURRENCY_CODE = "BYN";

  const availableCities = [
    { name: "Москва", code: "SVO" },
    { name: "Санкт-Петербург", code: "LED" },
    { name: "Сочи", code: "AER" },
    { name: "Казань", code: "KZN" },
    { name: "Владивосток", code: "VVO" },
    { name: "Екатеринбург", code: "SVX" },
    { name: "Новосибирск", code: "OVB" },
  ];

  const cityPriceIndex = {
    Москва: 95,
    "Санкт-Петербург": 82,
    Сочи: 118,
    Казань: 88,
    Владивосток: 285,
    Екатеринбург: 122,
    Новосибирск: 175,
  };

  function formatMoney(amount) {
    try {
      return new Intl.NumberFormat(CURRENCY_LOCALE, {
        style: "currency",
        currency: CURRENCY_CODE,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${Math.round(amount)} BYN`;
    }
  }

  function findMatches(inputValue) {
    if (!inputValue) return [];
    const lower = inputValue.toLowerCase();
    return availableCities.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.code.toLowerCase().includes(lower)
    );
  }

  function showSuggestions(inputEl, suggestionsId, matches) {
    const box = document.getElementById(suggestionsId);
    if (!box) return;
    if (!matches.length || !inputEl.value.trim()) {
      box.style.display = "none";
      return;
    }
    box.innerHTML = "";
    matches.forEach((city) => {
      const row = document.createElement("div");
      row.className = "suggestion-item";
      row.textContent = `${city.name} (${city.code})`;
      row.addEventListener("click", () => {
        inputEl.value = `${city.name} (${city.code})`;
        box.style.display = "none";
        validateCity(inputEl.id);
        checkSameCities();
      });
      box.appendChild(row);
    });
    box.style.display = "block";
  }

  function parseCityName(value) {
    return value.split("(")[0].trim();
  }

  function validateCity(fieldId) {
    const input = document.getElementById(fieldId);
    if (!input) return true;
    const errorId = fieldId === "fromCity" ? "fromError" : "toError";
    const errorSpan = document.getElementById(errorId);
    const value = input.value.trim();

    if (!value) {
      if (errorSpan) errorSpan.textContent = "Поле обязательно для заполнения";
      input.classList.add("input-error");
      return false;
    }

    const cityName = parseCityName(value);
    const ok = availableCities.some(
      (c) =>
        c.name.toLowerCase() === cityName.toLowerCase() ||
        value.includes(c.code)
    );

    if (!ok) {
      if (errorSpan)
        errorSpan.textContent = "Рейс в выбранный пункт не выполняется";
      input.classList.add("input-error");
      return false;
    }

    if (errorSpan) errorSpan.textContent = "";
    input.classList.remove("input-error");
    return true;
  }

  function checkSameCities() {
    const fromInput = document.getElementById("fromCity");
    const toInput = document.getElementById("toCity");
    if (!fromInput || !toInput) return true;

    const fromName = parseCityName(fromInput.value);
    const toName = parseCityName(toInput.value);
    const toError = document.getElementById("toError");

    if (
      fromName &&
      toName &&
      fromName.toLowerCase() === toName.toLowerCase()
    ) {
      if (toError)
        toError.textContent =
          "Город отправления и назначения не могут совпадать";
      toInput.classList.add("input-error");
      return false;
    }

    if (
      toError &&
      toError.textContent.includes("не могут совпадать")
    ) {
      toError.textContent = "";
      toInput.classList.remove("input-error");
    }
    return true;
  }

  function validateDates() {
    const depart = document.getElementById("departDate");
    const returnDate = document.getElementById("returnDate");
    const dateError = document.getElementById("dateError");
    if (!depart) return true;

    const departVal = depart.value;
    const returnVal = returnDate ? returnDate.value : "";
    const oneWay = document.getElementById("oneway")?.checked;

    if (!departVal) {
      if (dateError) dateError.textContent = "Выберите дату вылета";
      return false;
    }

    if (oneWay) {
      if (dateError) dateError.textContent = "";
      return true;
    }

    if (!returnVal) {
      if (dateError) dateError.textContent = "Выберите дату возврата";
      return false;
    }

    if (new Date(returnVal) < new Date(departVal)) {
      if (dateError)
        dateError.textContent =
          "Дата возврата не может быть раньше даты вылета";
      return false;
    }

    if (dateError) dateError.textContent = "";
    return true;
  }

  function validateFlightForm() {
    const citiesOk =
      validateCity("fromCity") &&
      validateCity("toCity") &&
      checkSameCities();
    return citiesOk && validateDates();
  }

  function estimateSearchPriceBYN(fromStr, toStr, travelClass, roundTrip) {
    const fromName = parseCityName(fromStr);
    const toName = parseCityName(toStr);
    const a = cityPriceIndex[fromName] ?? 120;
    const b = cityPriceIndex[toName] ?? 120;
    let base = a + b;
    if (travelClass === "Бизнес") base *= 2.5;
    if (travelClass === "Комфорт") base *= 1.35;
    if (roundTrip) base *= 1.75;
    return Math.max(49, Math.floor(base));
  }

  function initBookingPage() {
    const fromInput = document.getElementById("fromCity");
    const toInput = document.getElementById("toCity");
    if (!fromInput || !toInput) return;

    const fromBox = document.getElementById("fromSuggestions");
    const toBox = document.getElementById("toSuggestions");

    fromInput.addEventListener("input", function () {
      showSuggestions(this, "fromSuggestions", findMatches(this.value));
      validateCity("fromCity");
      checkSameCities();
    });

    toInput.addEventListener("input", function () {
      showSuggestions(this, "toSuggestions", findMatches(this.value));
      validateCity("toCity");
      checkSameCities();
    });

    document.addEventListener("click", (e) => {
      const t = e.target;
      if (
        !fromInput.contains(t) &&
        fromBox &&
        !fromBox.contains(t)
      ) {
        fromBox.style.display = "none";
      }
      if (!toInput.contains(t) && toBox && !toBox.contains(t)) {
        toBox.style.display = "none";
      }
    });

    document.getElementById("departDate")?.addEventListener("change", validateDates);
    document.getElementById("returnDate")?.addEventListener("change", validateDates);

    const roundtrip = document.getElementById("roundtrip");
    const oneway = document.getElementById("oneway");
    const returnDateGroup = document.getElementById("returnDateGroup");
    const returnDateInput = document.getElementById("returnDate");

    function toggleReturnDate() {
      if (oneway?.checked) {
        if (returnDateGroup) returnDateGroup.style.opacity = "0.5";
        if (returnDateInput) returnDateInput.disabled = true;
        const dateError = document.getElementById("dateError");
        if (dateError) dateError.textContent = "";
      } else {
        if (returnDateGroup) returnDateGroup.style.opacity = "1";
        if (returnDateInput) returnDateInput.disabled = false;
        validateDates();
      }
    }

    if (roundtrip && oneway) {
      roundtrip.addEventListener("change", toggleReturnDate);
      oneway.addEventListener("change", toggleReturnDate);
      toggleReturnDate();
    }

    const today = new Date().toISOString().split("T")[0];
    document
      .querySelectorAll('input[type="date"]')
      .forEach((el) => el.setAttribute("min", today));
  }

  function initSearchModal() {
    const searchForm = document.getElementById("searchForm");
    const searchModal = document.getElementById("searchResultsModal");
    const searchResultsContent = document.getElementById("searchResultsContent");
    const resultPriceSpan = document.getElementById("searchResultPrice");
    const closeSearchModal = document.getElementById("closeSearchModal");
    const proceedToBookBtn = document.getElementById("proceedToBookBtn");
    const bookingModal = document.getElementById("bookingModal");
    const modalFlightInfo = document.getElementById("modalFlightInfo");

    let lastSearchData = null;

    function showSearchResults() {
      const from = document.getElementById("fromCity")?.value ?? "";
      const to = document.getElementById("toCity")?.value ?? "";
      const depart = document.getElementById("departDate")?.value ?? "";
      const ret = document.getElementById("returnDate")?.value ?? "";
      const passengers = document.getElementById("passengers")?.value ?? "";
      const travelClass = document.getElementById("classSelect")?.value ?? "Эконом";
      const isOneWay = document.getElementById("oneway")?.checked;

      const route = `${from} → ${to}`;
      const dateInfo = isOneWay ? depart : `${depart} — ${ret}`;
      const passengerInfo = `${passengers}, класс ${travelClass}`;
      const totalPrice = estimateSearchPriceBYN(from, to, travelClass, !isOneWay);

      if (searchResultsContent) {
        searchResultsContent.innerHTML = `
          <p><strong>Маршрут:</strong> ${route}</p>
          <p><strong>Даты:</strong> ${dateInfo}</p>
          <p><strong>Пассажиры:</strong> ${passengerInfo}</p>
          <p><strong>Рейс:</strong> Apex Sky Airlines (прямой)</p>
        `;
      }
      if (resultPriceSpan) {
        resultPriceSpan.textContent = `Итого: ${formatMoney(totalPrice)}`;
      }

      lastSearchData = { route, dateInfo, passengerInfo, totalPrice };
      if (searchModal) searchModal.style.display = "flex";
    }

    searchForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      if (validateFlightForm()) {
        showSearchResults();
      } else {
        alert("Пожалуйста, исправьте ошибки в форме");
      }
    });

    closeSearchModal?.addEventListener("click", () => {
      if (searchModal) searchModal.style.display = "none";
    });

    proceedToBookBtn?.addEventListener("click", () => {
      if (searchModal) searchModal.style.display = "none";
      if (bookingModal && modalFlightInfo && lastSearchData) {
        modalFlightInfo.textContent = `${lastSearchData.route} | ${formatMoney(lastSearchData.totalPrice)}`;
        bookingModal.style.display = "flex";
      }
    });
  }

  function initBookButtons() {
    const bookingModal = document.getElementById("bookingModal");
    const modalFlightInfo = document.getElementById("modalFlightInfo");
    if (!bookingModal || !modalFlightInfo) return;

    document.querySelectorAll(".book-flight-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const flight = btn.getAttribute("data-flight");
        const price = Number(btn.getAttribute("data-price") || 0);
        modalFlightInfo.textContent = `${flight} | ${formatMoney(price)}`;
        bookingModal.style.display = "flex";
      });
    });

    document.querySelectorAll(".btn-book-hotel").forEach((btn) => {
      btn.addEventListener("click", () => {
        const hotel = btn.getAttribute("data-hotel");
        const price = Number(btn.getAttribute("data-price") || 0);
        modalFlightInfo.textContent = `${hotel} | ${formatMoney(price)} за ночь`;
        bookingModal.style.display = "flex";
      });
    });
  }

  function initBookingModal() {
    const bookingModal = document.getElementById("bookingModal");
    const form = document.getElementById("bookingFormModal");
    const modalFlightInfo = document.getElementById("modalFlightInfo");
    const closeBtn = document.querySelector("#bookingModal .modal-close");

    closeBtn?.addEventListener("click", () => {
      if (bookingModal) bookingModal.style.display = "none";
    });

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("fullName")?.value.trim() ?? "";
      const email = document.getElementById("email")?.value.trim() ?? "";
      const phone = document.getElementById("phone")?.value.trim() ?? "";
      const passport = document.getElementById("passport")?.value.trim() ?? "";
      if (!name || !email || !phone || !passport) {
        alert("Заполните все обязательные поля");
        return;
      }
      const summary = modalFlightInfo?.textContent ?? "";
      alert(
        `Спасибо, ${name}! Бронирование (${summary}) принято. Мы свяжемся с вами в ближайшее время.`
      );
      if (bookingModal) bookingModal.style.display = "none";
      form.reset();
    });
  }

  function initModalBackdropClose() {
    const searchModal = document.getElementById("searchResultsModal");
    const bookingModal = document.getElementById("bookingModal");

    window.addEventListener("click", (e) => {
      if (searchModal && e.target === searchModal) {
        searchModal.style.display = "none";
      }
      if (bookingModal && e.target === bookingModal) {
        bookingModal.style.display = "none";
      }
    });
  }

  function initRulesAccordion() {
    document.querySelectorAll(".rule-question").forEach((question) => {
      question.addEventListener("click", () => {
        const answer = question.nextElementSibling;
        if (!answer || !answer.classList.contains("rule-answer")) return;
        const open = answer.style.display === "block";
        answer.style.display = open ? "none" : "block";
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initBookingPage();
    initSearchModal();
    initBookButtons();
    initBookingModal();
    initModalBackdropClose();
    initRulesAccordion();
    initRulesAccordion();
  });
})();
  function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = contactForm.querySelector('input[placeholder="Иван Иванов"]');
      const emailInput = contactForm.querySelector('input[placeholder="example@mail.ru"]');
      const phoneInput = contactForm.querySelector('input[placeholder="+375 (29) 123-45-67"]');
      const messageTextarea = contactForm.querySelector('textarea[placeholder="Опишите ваш вопрос или пожелание..."]');

      const name = nameInput?.value.trim() || '';
      const email = emailInput?.value.trim() || '';
      const phone = phoneInput?.value.trim() || '';
      const message = messageTextarea?.value.trim() || '';

      if (!name || !email || !phone || !message) {
        alert('Пожалуйста, заполните все поля формы.');
        return;
      }

      if (!email.includes('@') || !email.includes('.')) {
        alert('Введите корректный email (например, name@domain.com).');
        return;
      }

      alert(`Спасибо, ${name}! Ваше сообщение отправлено. Мы свяжемся с вами в ближайшее время.`);

      if (nameInput) nameInput.value = '';
      if (emailInput) emailInput.value = '';
      if (phoneInput) phoneInput.value = '';
      if (messageTextarea) messageTextarea.value = '';
    });
  }

  initContactForm();