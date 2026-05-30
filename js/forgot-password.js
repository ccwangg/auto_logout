if (redirectIfLoggedIn()) {}

document.getElementById("forgotForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("兩次輸入的新密碼不相符");
    return;
  }

  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.textContent = "處理中…";

  try {
    const data = await api.post("/api/auth/forgot-password", {
      username: document.getElementById("username").value.trim(),
      recoveryCode: document.getElementById("recoveryCode").value,
      password,
      confirmPassword,
    });
    alert(data.message || "密碼已重設");
    window.location.href = "login.html";
  } catch (err) {
    alert(err.data?.message || err.message || "重設失敗");
  } finally {
    btn.disabled = false;
    btn.textContent = "重設密碼";
  }
});
