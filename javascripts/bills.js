import { endAdminSession, hasAdminSession } from './admin-session.js';
import { BILLS_KEY, formatMoney, loadBills, makeElement, saveBills } from './store.js';

// ---------- Page elements ----------
const billReviewPage = document.getElementById('billReviewPage');
const billReviewList = document.getElementById('billReviewList');
const billCountText = document.getElementById('billCount');
const message = document.getElementById('billReviewMessage');
const signOutButton = document.getElementById('signOutButton');

// ---------- Data ----------
let bills = [];
let loadFailed = false;

// ---------- Show the bills on the page ----------
function showBills() {
  billReviewList.replaceChildren(); // clear the list first
  billCountText.textContent = bills.length === 1 ? '1 bill' : bills.length + ' bills';

  if (bills.length === 0) {
    let text = 'No bills have been submitted for review yet.';
    if (loadFailed) text = 'Bills could not be loaded from this browser.';
    billReviewList.append(makeElement('p', text, 'bill-review-empty'));
    return;
  }

  for (const bill of bills) {
    showOneBill(bill);
  }
}

function showOneBill(bill) {
  const card = makeElement('article', undefined, 'bill-review-card');

  // Top part: bill number, date and status
  const heading = makeElement('div', undefined, 'bill-review-heading');
  const titleBox = makeElement('div');
  const date = new Date(bill.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  titleBox.append(makeElement('h3', 'Bill #' + bill.id), makeElement('p', date));

  const status = makeElement('span');
  if (bill.reviewed) {
    status.textContent = 'Reviewed';
    status.className = 'bill-status is-reviewed';
  } else {
    status.textContent = 'Needs review';
    status.className = 'bill-status';
  }
  heading.append(titleBox, status);

  // Middle part: the list of items
  const itemList = makeElement('ul', undefined, 'bill-review-items');
  for (const item of bill.items) {
    const lineTotal = formatMoney(item.price * item.quantity);
    itemList.append(makeElement('li', item.name + ' × ' + item.quantity + ' — ' + lineTotal));
  }

  // Bottom part: total and the "Mark reviewed" button
  const footer = makeElement('div', undefined, 'bill-review-footer');
  footer.append(makeElement('strong', 'Total: ' + formatMoney(bill.total)));

  if (bill.reviewed === false) {
    const reviewButton = makeElement('button', 'Mark reviewed', 'secondary-button');
    reviewButton.type = 'button';
    reviewButton.addEventListener('click', function () {
      markAsReviewed(bill.id);
    });
    footer.append(reviewButton);
  }

  card.append(heading, itemList, footer);
  billReviewList.append(card);
}

// ---------- Actions ----------
function loadAndShow() {
  try {
    bills = loadBills();
    loadFailed = false;
    message.textContent = '';
  } catch (error) {
    loadFailed = true;
    message.textContent = "Saved bills could not be loaded. Check this browser's storage.";
  }
  showBills();
}

function markAsReviewed(billId) {
  // Make a copy of the bills where this one is marked as reviewed
  const updatedBills = [];
  for (const bill of bills) {
    if (bill.id === billId) {
      updatedBills.push({ ...bill, reviewed: true });
    } else {
      updatedBills.push(bill);
    }
  }

  try {
    saveBills(updatedBills);
  } catch (error) {
    message.textContent = 'Could not save this review in this browser. Check storage permissions and try again.';
    return;
  }

  bills = updatedBills;
  message.textContent = 'Bill #' + billId + ' marked as reviewed.';
  showBills();
}

// ---------- Events ----------
signOutButton.addEventListener('click', function () {
  endAdminSession();
  window.location.replace('admin.html');
});

// Runs when another browser tab changes the saved bills
window.addEventListener('storage', function (event) {
  if (event.key === BILLS_KEY || event.key === null) {
    loadAndShow();
  }
});

// ---------- Start ----------
if (hasAdminSession()) {
  billReviewPage.hidden = false;
  loadAndShow();
} else {
  window.location.replace('admin.html'); // not signed in
}