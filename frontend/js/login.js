// js/signup.js
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch("http://localhost:3000/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                password
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message)
            return;
        }

        localStorage.setItem('token', data.token)
        window.location.href = "../chatbot.html";
    } catch (err) {
        console.log("error: ", err)
    }
});
