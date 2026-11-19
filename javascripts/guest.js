import { PRODUCTS_KEY, formatMoney, getDefaultProducts, loadBills, loadProducts, makeElement, saveBills } from './store.js';

// ---------- Page elements ----------
const searchInput = document.getElementById('productSearch');
const categorySelect = document.getElementById('categoryFilter');
const productGrid = document.getElementById('guestProductGrid');
const resultCountText = document.getElementById('storeResultCount');

const billItemsBox = document.getElementById('billItems');
const billItemCountText = document.getElementById('billItemCount');
const billSubtotalText = document.getElementById('billSubtotal');
const billTotalText = document.getElementById('billTotal');
const message = document.getElementById('billMessage');
const generateBillButton = document.getElementById('generateBillButton');

// ---------- Data ----------
let products = [];
try {
  products = loadProducts();
} catch (error) {
  products = getDefaultProducts();
  message.textContent = 'Saved products could not be loaded. Showing the sample list instead.';
}

// The cart is a list like: [ { productId: 1, quantity: 2 }, { productId: 3, quantity: 1 } ]
let cart = [];

// ---------- Small helper functions ----------
function findProduct(productId) {
  return products.find(function (product) {
    return product.id === productId;
  });
}

// How many of this product are in the cart? (0 if none)
function getCartQuantity(productId) {
  for (const entry of cart) {
    if (entry.productId === productId) return entry.quantity;
  }
  return 0;
}

// Sets the quantity of a product in the cart. A quantity of 0 removes it.
function setCartQuantity(productId, quantity) {
  cart = cart.filter(function (entry) {
    return entry.productId !== productId;
  });
  if (quantity > 0) cart.push({ productId: productId, quantity: quantity });
}

// ---------- Category dropdown ----------
function showCategories() {
  const previousChoice = categorySelect.value;

  // Collect each category once
  const categories = [];
  for (const product of products) {
    if (!categories.includes(product.category)) categories.push(product.category);
  }
  categories.sort();

  categorySelect.replaceChildren(new Option('All categories', 'all'));
  for (const category of categories) {
    categorySelect.append(new Option(category, category));
  }

  // Keep the old choice if it still exists
  if (categories.includes(previousChoice)) {
    categorySelect.value = previousChoice;
  } else {
    categorySelect.value = 'all';
  }
}

// ---------- Product list ----------
function showProducts() {
  const search = searchInput.value.trim().toLowerCase();
  const chosenCategory = categorySelect.value;

  // Keep only the products that match the search and the category
  const matches = products.filter(function (product) {
    const text = (product.name + ' ' + product.category).toLowerCase();
    const searchMatches = text.includes(search);
    const categoryMatches = chosenCategory === 'all' || product.category === chosenCategory;
    return searchMatches && categoryMatches;
  });

  productGrid.replaceChildren(); // clear the grid first
  resultCountText.textContent = matches.length === 1 ? '1 product' : matches.length + ' products';

  if (matches.length === 0) {
    productGrid.append(makeElement('p', 'No products found. Try a different search or category.', 'store-empty-state'));
    return;
  }

  for (const product of matches) {
    productGrid.append(makeProductCard(product));
  }
}

function makeProductCard(product) {
  const card = makeElement('article', undefined, 'guest-product-card');

  const details = makeElement('div', undefined, 'guest-product-details');
  let stockText = 'Out of stock';
  if (product.stock > 0) stockText = product.stock + ' in stock';
  details.append(makeElement('strong', formatMoney(product.price)), makeElement('span', stockText));

  // The "Add to bill" button changes depending on the stock
  const addButton = makeElement('button', 'Add to bill', 'primary-button');
  addButton.type = 'button';
  const inCart = getCartQuantity(product.id);

  if (product.stock === 0) {
    addButton.textContent = 'Out of stock';
    addButton.disabled = true;
  } else if (inCart >= product.stock) {
    addButton.textContent = 'Stock limit reached';
    addButton.disabled = true;
  }

  addButton.addEventListener('click', function () {
    addToCart(product);
  });

  card.append(
    makeElement('p', product.category, 'guest-product-category'),
    makeElement('h2', product.name),
    details,
    addButton,
  );
  return card;
}

// ---------- Cart actions ----------
function addToCart(product) {
  const quantity = getCartQuantity(product.id);
  if (quantity >= product.stock) {
    message.textContent = 'Only ' + product.stock + ' ' + product.name + ' available in stock.';
    return;
  }

  setCartQuantity(product.id, quantity + 1);
  message.textContent = product.name + ' added to your bill.';
  showProducts();
  showBill();
}

function changeQuantity(product, change) {
  const newQuantity = getCartQuantity(product.id) + change;
  if (newQuantity > product.stock) return;

  setCartQuantity(product.id, newQuantity);
  message.textContent = '';
  showProducts();
  showBill();
}

// ---------- The bill on the right ----------
function showBill() {
  billItemsBox.replaceChildren(); // clear the bill first

  let itemCount = 0;
  let total = 0;

  if (cart.length === 0) {
    billItemsBox.append(makeElement('p', 'Your bill is empty. Add a product to get started.', 'bill-empty-state'));
  }

  for (const entry of cart) {
    const product = findProduct(entry.productId);
    if (!product) continue;

    itemCount = itemCount + entry.quantity;
    total = total + product.price * entry.quantity;
    billItemsBox.append(makeBillLine(product, entry.quantity));
  }

  billItemCountText.textContent = itemCount;
  billSubtotalText.textContent = formatMoney(total);
  billTotalText.textContent = formatMoney(total);
  generateBillButton.disabled = cart.length === 0;
}

function makeBillLine(product, quantity) {
  const line = makeElement('div', undefined, 'bill-item');

  // Name and price of one item
  const top = makeElement('div', undefined, 'bill-item-heading');
  top.append(makeElement('strong', product.name), makeElement('span', formatMoney(product.price) + ' each'));

  // − and + buttons
  const minusButton = makeElement('button', '−');
  minusButton.type = 'button';
  minusButton.setAttribute('aria-label', 'Remove one ' + product.name);
  minusButton.addEventListener('click', function () {
    changeQuantity(product, -1);
  });

  const plusButton = makeElement('button', '+');
  plusButton.type = 'button';
  plusButton.setAttribute('aria-label', 'Add one ' + product.name);
  plusButton.disabled = quantity >= product.stock;
  plusButton.addEventListener('click', function () {
    changeQuantity(product, 1);
  });

  const controls = makeElement('div', undefined, 'bill-quantity-controls');
  controls.append(minusButton, makeElement('span', quantity), plusButton);

  const bottom = makeElement('div', undefined, 'bill-item-footer');
  bottom.append(controls, makeElement('strong', formatMoney(product.price * quantity)));

  line.append(top, bottom);
  return line;
}

// ---------- Generate the bill ----------
function generateBill() {
  // Build the list of bill items from the cart
  const billItems = [];
  let total = 0;
  for (const entry of cart) {
    const product = findProduct(entry.productId);
    if (!product) continue;

    billItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: entry.quantity,
    });
    total = total + product.price * entry.quantity;
  }
  if (billItems.length === 0) return;

  try {
    const oldBills = loadBills();

    let highestId = 0;
    for (const bill of oldBills) {
      if (bill.id > highestId) highestId = bill.id;
    }

    const newBill = {
      id: highestId + 1,
      createdAt: new Date().toISOString(),
      items: billItems,
      total: total,
      reviewed: false,
    };
    saveBills([newBill, ...oldBills]); // newest bill goes first
  } catch (error) {
    message.textContent = 'Could not save this bill in this browser. Check storage permissions and try again.';
    return;
  }

  cart = [];
  message.textContent = 'Bill generated and sent for administrator review.';
  showProducts();
  showBill();
}

// ---------- Events ----------
searchInput.addEventListener('input', showProducts);
categorySelect.addEventListener('change', showProducts);
generateBillButton.addEventListener('click', generateBill);

// Runs when another browser tab changes the saved products
window.addEventListener('storage', function (event) {
  if (event.key !== PRODUCTS_KEY && event.key !== null) return;

  try {
    products = loadProducts();
  } catch (error) {
    message.textContent = 'Product updates could not be loaded from the other tab.';
    return;
  }

  // Fix the cart if a product was removed or its stock went down
  for (const entry of [...cart]) {
    const product = findProduct(entry.productId);
    if (!product) {
      setCartQuantity(entry.productId, 0);
    } else if (entry.quantity > product.stock) {
      setCartQuantity(entry.productId, product.stock);
    }
  }

  showCategories();
  showProducts();
  showBill();
});

// ---------- Start ----------
showCategories();
showProducts();
showBill();