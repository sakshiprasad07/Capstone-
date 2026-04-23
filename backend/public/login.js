document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const API = import.meta.env.VITE_API_URL;

  const res = await fetch(`${API}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });


  const data = await res.json();

  if (res.status === 200) {
    localStorage.setItem("token", data.token);
    alert("Login successful!");
  } else {
    alert(data.message);
  }
});