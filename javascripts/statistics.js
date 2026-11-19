import { endAdminSession, hasAdminSession } from './admin-session.js';
import { BILLS_KEY, PRODUCTS_KEY, formatMoney, loadBills, loadProducts } from './store.js';

// ---------- Page elements ----------
const statisticsPage = document.getElementById('statisticsPage');
const message = document.getElementById('statisticsMessage');
const productCountText = document.getElementById('statisticsProductCount');
const stockCountText = document.getElementById('statisticsStockCount');
const inventoryValueText = document.getElementById('statisticsInventoryValue');
const billCountText = document.getElementById('statisticsBillCount');
const billValueText = document.getElementById('statisticsBillValue');
const pendingCountText = document.getElementById('statisticsPendingCount');
const signOutButton = document.getElementById('signOutButton');

// ---------- Data ----------
let products = [];
let bills = [];
let productsFailed = false; // true if products could not be loaded
let billsFailed = false;    // true if bills could not be loaded

// ---------- Show the numbers on the page ----------
function showStatistics() {
  let totalStock = 0;
  let inventoryValue = 0;
  for (const product of products) {
    totalStock = totalStock + product.stock;
    inventoryValue = inventoryValue + product.price * product.stock;
  }

  let billsValue = 0;
  let pendingBills = 0;
  for (const bill of bills) {
    billsValue = billsValue + bill.total;
    if (bill.reviewed === false) pendingBills = pendingBills + 1;
  }

  if (productsFailed) {
    productCountText.textContent = 'Unavailable';
    stockCountText.textContent = 'Unavailable';
    inventoryValueText.textContent = 'Unavailable';
  } else {
    productCountText.textContent = products.length;
    stockCountText.textContent = totalStock;
    inventoryValueText.textContent = formatMoney(inventoryValue);
  }

  if (billsFailed) {
    billCountText.textContent = 'Unavailable';
    billValueText.textContent = 'Unavailable';
    pendingCountText.textContent = 'Unavailable';
  } else {
    billCountText.textContent = bills.length;
    billValueText.textContent = formatMoney(billsValue);
    pendingCountText.textContent = pendingBills;
  }

  message.textContent = '';
  if (productsFailed) message.textContent += 'Product statistics could not be loaded. ';
  if (billsFailed) message.textContent += 'Bill statistics could not be loaded.';
}

function loadAndShow() {
  try {
    products = loadProducts();
    productsFailed = false;
  } catch (error) {
    productsFailed = true;
  }

  try {
    bills = loadBills();
    billsFailed = false;
  } catch (error) {
    billsFailed = true;
  }

  showStatistics();
}

// ---------- Events ----------
signOutButton.addEventListener('click', function () {
  endAdminSession();
  window.location.replace('admin.html');
});

// Runs when another browser tab changes the saved data
window.addEventListener('storage', function (event) {
  if (event.key === PRODUCTS_KEY || event.key === BILLS_KEY || event.key === null) {
    loadAndShow();
  }
});

// ---------- Start ----------
if (hasAdminSession()) {
  statisticsPage.hidden = false;
  loadAndShow();
} else {
  window.location.replace('admin.html'); // not signed in
}