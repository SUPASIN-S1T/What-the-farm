let productContainer = document.querySelector(".products-container");
let productList = document.querySelector(".products-grid-container");
const cartBtn = document.querySelector(".cart");
const asideContainer = document.querySelector(".aside-container");
const btnClose = document.querySelector(".btn-close");
const cartItem = document.querySelector(".aside-cart-item");
const boxFadeItem = document.querySelector(".fade-background-sidebar");
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let products = JSON.parse(localStorage.getItem("products")) || [];

document.addEventListener("DOMContentLoaded", async () => {
  await fetchProduct();
  savedItem();
  selectedTypeProduct();
  btnModal();
});

document.addEventListener("scroll", () => {
  const navbar = document.querySelector(".header-container");
  window.scrollY > 0
    ? navbar.classList.add("navbar-fixed")
    : navbar.classList.remove("navbar-fixed");
});

const savedItem = () => {
  if (products.length > 0) {
    products.forEach((product) => {
      cartItemTemplate(product);
      updateCartItem();
      calculateTotal();
    });
  }
};

const btnModal = () => {
  const btns = document.querySelectorAll(".btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const btnCurrent = e.currentTarget;
      if (btnCurrent.value === "btn-type" || btnCurrent.value === "btn-sort") {
        btnCurrent.nextElementSibling.classList.toggle("open-modal");
      }
    });
  });
};

const fetchProduct = async () => {
  try {
    const response = await fetch("tree.json");
    const json = await response.json();
    const result = await json.trees;
    // sending data
    productListTemplate(result);
  } catch (err) {
    console.log(`err : ${err}`);
  }
};

const productListTemplate = (data) => {
  data.map((product, index) => {
    const {
      tree_detail: detail,
      tree_name: name,
      tree_pics: pics,
      tree_price: price,
      tree_type: type,
    } = product;
    const itemID = index + 1;
    const divTemplate = `
          <div class="product-list" data-product-id="${itemID}" data-type-name="${type}">
            <img id="image" src="${pics}" alt="${name}" />
            <div class="product-detail">
            <h1 id="name">${name}</h1>
            <p id="detail">${detail}</p>
            <div class="product-sub-detail">
              <span id="price">${numberWithCommas(price)}</span>
              <span id="text">บาท / ต้น</span>
            </div>
            <button class="buy-now" onclick="btnBuyNow(this)"><i class="fa-solid fa-cart-shopping"></i> หยิบใส่ตะกร้า</button>
            </div>
            <button class="like-btn" data-num="${itemID}"><i class="fa-solid fa-heart"></i></button>
          </div>`;
    productList.innerHTML += divTemplate;
  });
  btnLike();
};

const btnLike = () => {
  const btns = document.querySelectorAll(".like-btn");

  // set styles when click button like
  btns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const currentID = e.currentTarget.dataset.num;

      if (!e.currentTarget.classList.contains("like-active")) {
        e.currentTarget.classList.add("like-active");
        favorites.push(currentID);
      } else {
        e.currentTarget.classList.remove("like-active");
        const index = favorites.indexOf(currentID);
        if (index > -1) {
          favorites.splice(index, 1); // remove from favorites (localStorage)
        }
      }

      localStorage.setItem("favorites", JSON.stringify(favorites));
    });
  });

  // update when page load from local storage
  btns.forEach((btn) => {
    const btnID = btn.getAttribute("data-num");
    if (favorites.includes(btnID)) {
      btn.classList.add("like-active");
    }
  });
};

cartBtn.addEventListener("click", () => {
  asideContainer.classList.add("aside-active");
  boxFadeItem.classList.add("fade-background-sidebar-active");
});

btnClose.addEventListener("click", () => {
  asideContainer.classList.remove("aside-active");
  boxFadeItem.classList.remove("fade-background-sidebar-active");
});

const btnBuyNow = (e) => {
  const item = e.parentElement.parentElement;
  const itemId = item.dataset.productId;
  const image = item.querySelector("#image").src;
  const name = item.querySelector("#name").textContent;
  const detail = item.querySelector("#detail").textContent;
  const price = item.querySelector("#price").innerHTML;
  addToCart(itemId, image, name, detail, price);
};

const addToCart = (itemId, img, name, detail, price) => {
  const itemPrice = price.replace(",", "");
  const itemCart = {
    id: itemId,
    image: img,
    name: name,
    detail: detail,
    price: itemPrice,
    quantity: 1,
  };

  const existingItem = products.find((item) => item.id === itemId);
  if (!existingItem) {
    products.push(itemCart);
    cartItemTemplate(itemCart);
    inputUpdateQuantity();
  }
  // else {
  //   existingItem.quantity++;
  //   let quantityUpdate = document.querySelector(
  //     `.cart-item[data-item-id="${itemId}"] .quantity-item`
  //   );
  //   quantityUpdate.setAttribute("value", existingItem.quantity);
  // }

  localStorage.setItem("products", JSON.stringify(products));
  updateCartItem();
  updateSubTotal(itemId);
  calculateTotal();
};

const cartItemTemplate = (data) => {
  const { detail, id, image, name, price, quantity } = data;
  const subtotal = price * quantity;
  const template = `<div class="cart-item" data-item-id="${id}">
      <img src="${image}" alt="${name}" width="80" />
      <div class="cart-detail">
        <h1>${name}</h1>
        <p>${detail}</p>
        <div class="cart-sub-detail">
        <span id="price">${numberWithCommas(price)}</span>
        <span id="text">/ ต้น</span>
        </div>
      </div>
      <button class="del-item" onclick="removeCartItem(this)">
        <i class="fa-solid fa-trash-can"></i>
      </button>
      <input type="number" min="1" max="10000" value="${quantity}" class="quantity-item" />
      <p id="subtotal">${numberWithCommas(subtotal)}</p>
    </div>`;
  cartItem.innerHTML += template;

  inputUpdateQuantity();
};

const removeCartItem = (e) => {
  const itemCurrent = e.parentElement;
  const itemId = e.parentElement.dataset.itemId;
  itemCurrent.remove();
  const existingItem = products.findIndex((item) => item.id === itemId);
  if (existingItem !== -1) {
    products.splice(existingItem, 1);
    localStorage.setItem("products", JSON.stringify(products));
  }
  updateCartItem();
  calculateTotal();
};

const updateCartItem = () => {
  const quantityCart = document.querySelector(".quantity-cart");
  const items = document.querySelectorAll(".cart-item").length;
  quantityCart.textContent = items;
};

const calculateTotal = () => {
  const result = document.querySelector(".aside-cart-result span");
  let sum = 0;
  products.forEach((product) => {
    sum += product.price * product.quantity;
  });
  result.innerHTML = `${numberWithCommas(sum)}฿`;
};

const updateSubTotal = (itemId) => {
  const cartItem = document.querySelector(
    `.cart-item[data-item-id="${itemId}"]`
  );
  const priceItem = Number(cartItem.querySelector("#price").textContent);
  const quantityItem = Number(cartItem.querySelector(".quantity-item").value);
  const subtotalValue = priceItem * quantityItem;
  const subtotalResult = cartItem.querySelector("#subtotal");
  subtotalResult.textContent = numberWithCommas(subtotalValue);
};

const numberWithCommas = (price) => {
  return price.toLocaleString("en-US");
};

const inputUpdateQuantity = () => {
  const inputItem = document.querySelectorAll(".quantity-item");
  inputItem.forEach((input) => {
    input.addEventListener("input", (e) => {
      const inputCurrentItem = e.target;
      const inputValue = e.target.value;
      const itemId = e.target.parentElement.dataset.itemId;
      const findItem = products.find((item) => item.id === itemId);
      if (findItem) {
        inputCurrentItem.setAttribute("value", inputValue);
        findItem.quantity = Number(inputValue);
        updateSubTotal(itemId);
        calculateTotal();
      }

      localStorage.setItem("products", JSON.stringify(products));
    });
  });
};

// const filterTypeProductItem = () => {
//   const inputItem = document.querySelectorAll("#modal-type input");
//   let selectedType = [];

//   inputItem.forEach((input) => {
//     input.addEventListener("click", (e) => {
//       const inputCurrent = e.currentTarget;
//       const inputId = e.currentTarget.id;
//       if (inputCurrent.checked) {
//         selectedType.push(inputId);
//       } else {
//         const indexToRemove = selectedType.indexOf(inputId);
//         selectedType.splice(indexToRemove, 1);
//       }
//       console.log(selectedType);

//       const productItem = document.querySelectorAll(".product-list");

//       productItem.forEach((product) => {
//         const findItem = selectedType.find((selected) => selected === product.dataset.typeName);

//         if (selectedType.length === 0 || selectedType.includes(findItem)) {
//           product.style.display = "flex";
//         } else {
//           product.style.display = "none";
//         }
//       });
//     });
//   });
// };

const selectedTypeProduct = () => {
  const selected = document.querySelector("#sorting-price");
  const productItem = document.querySelectorAll(".product-list");

  selected.addEventListener("change", (e) => {
    const optionValue = e.currentTarget.value;
    if (optionValue === "cheap" || optionValue === "expensive") {
      sortPriceProductItem(optionValue, productItem);
      console.log(sortPriceProductItem(optionValue, productItem));
    } else if (
      optionValue === "fejka" ||
      optionValue === "skycka" ||
      optionValue === "all"
    ) {
      filterTypeProductItem(optionValue, productItem);
    }
  });
};

const filterTypeProductItem = (optionValue, productItem) => {
  productItem.forEach((item) => {
    if (optionValue === item.dataset.typeName || optionValue === "all") {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
};

const sortPriceProductItem = (optionValue, productItem) => {
  const productArr = Array.from(productItem);
  productArr.sort((productA, productB) => {
    const priceA = Number(
      productA.querySelector("#price").textContent.replace(",", "")
    );
    const priceB = Number(
      productB.querySelector("#price").textContent.replace(",", "")
    );
    if (optionValue === "cheap") {
      return priceA - priceB;
    } else if (optionValue === "expensive") {
      return priceB - priceA;
    }
  });

  productList.innerHTML = "";

  productArr.forEach((product) => {
    productList.appendChild(product);
  });
};
