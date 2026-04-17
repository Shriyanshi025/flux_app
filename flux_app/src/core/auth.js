/**
 * Authentication Helper Module
 */

export function isAuth() {
  return !!localStorage.getItem('flux_user');
}

export function getCurrentUser() {
  return localStorage.getItem('flux_user');
}

export function logout() {
  localStorage.clear();
  location.reload();
}

export function saveUser(username) {
  localStorage.setItem('flux_user', username);
}
