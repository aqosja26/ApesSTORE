// Shared code: the sample products, and loading/saving products and bills
// in the browser's localStorage. Every other file imports from here.

export const PRODUCTS_KEY = 'apexstore.admin-preview.products.v1';
export const BILLS_KEY = 'apexstore.admin-preview.bills.v1';

const defaultProducts = [
  { id: 1, name: 'Pulse Wireless Headphones', category: 'Audio', price: 129, stock: 24 },
  { id: 2, name: 'Apex Mechanical Keyboard', category: 'Accessories', price: 89, stock: 18 },
  { id: 3, name: 'Precision Wireless Mouse', category: 'Accessories', price: 59, stock: 32 },
  { id: 4, name: 'Summit Laptop', category: 'Computing', price: 1499, stock: 7 },
];

// Turns a number like 129 into "$129.00"
const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export function formatMoney(amount) {
  return moneyFormatter.format(amount);
}

// Gives back a fresh copy of the sample products.
export function getDefaultProducts() {
  return JSON.parse(JSON.stringify(defaultProducts));
}

// Small helper to create an HTML element in one line.
// Example: makeElement('p', 'Hello', 'greeting')
export function makeElement(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

// Is this a real product? (used to check what we read from storage)
function isValidProduct(product) {
  return (
    product !== null &&
    typeof product === 'object' &&
    Number.isInteger(product.id) && product.id > 0 &&
    typeof product.name === 'string' &&
    typeof product.category === 'string' &&
    typeof product.price === 'number' && product.price >= 0 &&
    Number.isInteger(product.stock) && product.stock >= 0
  );
}

// Is this a real bill?
function isValidBill(bill) {
  if (
    bill === null ||
    typeof bill !== 'object' ||
    !Number.isInteger(bill.id) || bill.id <= 0 ||
    typeof bill.createdAt !== 'string' ||
    Number.isNaN(Date.parse(bill.createdAt)) ||
    typeof bill.reviewed !== 'boolean' ||
    typeof bill.total !== 'number' || bill.total < 0 ||
    !Array.isArray(bill.items) || bill.items.length === 0
  ) {
    return false;
  }

  for (const item of bill.items) {
    if (
      item === null ||
      typeof item.name !== 'string' ||
      typeof item.price !== 'number' || item.price < 0 ||
      !Number.isInteger(item.quantity) || item.quantity <= 0
    ) {
      return false;
    }
  }
  return true;
}

// Makes sure no two items in the list share the same id.
function hasDuplicateIds(list) {
  const seen = [];
  for (const item of list) {
    if (seen.includes(item.id)) return true;
    seen.push(item.id);
  }
  return false;
}

// Reads products from storage. Throws an error if the saved data is broken.
export function loadProducts() {
  const text = localStorage.getItem(PRODUCTS_KEY);
  if (text === null) return getDefaultProducts(); // nothing saved yet

  const products = JSON.parse(text);
  if (!Array.isArray(products) || !products.every(isValidProduct) || hasDuplicateIds(products)) {
    throw new Error('Saved product data is invalid.');
  }
  return products;
}

export function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

// Reads bills from storage. Throws an error if the saved data is broken.
export function loadBills() {
  const text = localStorage.getItem(BILLS_KEY);
  if (text === null) return []; // nothing saved yet

  const bills = JSON.parse(text);
  if (!Array.isArray(bills) || !bills.every(isValidBill) || hasDuplicateIds(bills)) {
    throw new Error('Saved bill data is invalid.');
  }
  return bills;
}

export function saveBills(bills) {
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
}
