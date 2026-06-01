redirectIfLoggedIn();

document.getElementById("togglePwd").addEventListener("click", () => {
  const input = document.getElementById("password");
  input.type = input.type === "password" ? "text" : "password";
});

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  setUser(username || "使用者");
  window.location.href = "dashboard.html";
});
