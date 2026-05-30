if (redirectIfLoggedIn()) {}

document.getElementById("togglePwd1").addEventListener("click", () => {
  const el = document.getElementById("password");
  el.type = el.type === "password" ? "text" : "password";
});
document.getElementById("togglePwd2").addEventListener("click", () => {
  const el = document.getElementById("confirmPassword");
  el.type = el.type === "password" ? "text" : "password";
});

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("兩次輸入的密碼不相符，請重新確認！");
    return;
  }

  const btn = document.getElementById("submitBtn");
  btn.disabled = true;

  try {
    const data = await api.post("/api/auth/register", {
      username: document.getElementById("account").value.trim(),
      password,
      confirmPassword,
      name: document.getElementById("name").value.trim(),
      role: document.getElementById("role").value,
    });
    alert(data.message || "註冊成功");
    window.location.href = "login.html";
  } catch (err) {
    alert("註冊失敗：" + (err.data?.message || err.message || "連線失敗"));
  } finally {
    btn.disabled = false;
  }
});
