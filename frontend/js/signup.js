// js/signup.js
document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const message = document.getElementById("message");
    console.log(name, email, password)

    try {
        const res = await fetch("http://localhost:3000/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
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
        alert(data.message)
        window.location.href = "../chatbot.html";
    } catch (err) {
        console.log("error: ", err)
        message.textContent = "Erreur réseau";
    }
});
