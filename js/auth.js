const TOKEN_KEY = "accessToken";
const USER_KEY = "user";
const MUST_CHANGE_KEY = "mustChangePassword";

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function setUser(username) {
  if (username) localStorage.setItem(USER_KEY, username);
  else localStorage.removeItem(USER_KEY);
}

function getUser() {
  return localStorage.getItem(USER_KEY) || "";
}

function setMustChangePassword(required) {
  if (required) localStorage.setItem(MUST_CHANGE_KEY, "1");
  else localStorage.removeItem(MUST_CHANGE_KEY);
}

function getMustChangePassword() {
  return localStorage.getItem(MUST_CHANGE_KEY) === "1";
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(MUST_CHANGE_KEY);
}

function requireAuth() {
  return true;
}

function redirectIfLoggedIn() {
  return false;
}
