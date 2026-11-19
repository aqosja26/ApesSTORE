// Remembers in the browser whether the admin is signed in.
const SESSION_KEY = 'apexstore.admin-preview.admin-access.v1';

export function hasAdminSession() {
  return localStorage.getItem(SESSION_KEY) === 'signed-in';
}

export function startAdminSession() {
  localStorage.setItem(SESSION_KEY, 'signed-in');
}

export function endAdminSession() {
  localStorage.removeItem(SESSION_KEY);
}