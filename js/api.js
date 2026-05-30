async function apiRequest(method, path, body, isFormData = false) {
  const url = `${CONFIG.API_BASE_URL}${path}`;
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData && body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const options = { method, headers };
  if (body !== undefined) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  const res = await fetch(url, options);
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const api = {
  get: (path) => apiRequest("GET", path),
  post: (path, body) => apiRequest("POST", path, body),
  delete: (path) => apiRequest("DELETE", path),
};
