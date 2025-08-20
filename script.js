document.addEventListener('DOMContentLoaded', function () {

    const input = document.getElementById('ideaInput');
    const button = document.getElementById('sendBtn');
    const responseDiv = document.getElementById('response');

    // Gestion de l'historique
    function getChatHistory() {
        let history = localStorage.getItem("chatHistory");
        return history ? JSON.parse(history) : [];
    }

    function saveChatHistory(history) {
        localStorage.setItem("chatHistory", JSON.stringify(history));
    }

    function addMessage(sender, text, status = "ok") {
        let history = getChatHistory();
        history.push({ sender, text, status, timestamp: new Date().toISOString() });
        saveChatHistory(history);
        renderChat();
    }

    function renderChat() {
        responseDiv.innerHTML = "";
        let history = getChatHistory();

        history.forEach(msg => {
            let bubble = document.createElement("div");
            bubble.className = `bubble ${msg.sender === "Utilisateur" ? "user-bubble" : "ai-bubble"}`; // Mettre des backsticks
            let p = document.createElement("p");
            p.textContent = msg.text;

            if (msg.status === "error") {
                p.style.color = "red";
            }

            bubble.appendChild(p);
            responseDiv.appendChild(bubble);
        });

        responseDiv.scrollTop = responseDiv.scrollHeight;
    }

    // Ajout d'une bulle "réflexion" temporaire
    function showThinkingBubble() {
        let bubble = document.createElement("div");
        bubble.className = "bubble ai-bubble thinking";
        bubble.innerHTML = "<p>Thinking...</p>";
        responseDiv.appendChild(bubble);
        responseDiv.scrollTop = responseDiv.scrollHeight;
        return bubble;
    }

    // Au clic sur le bouton
    button.addEventListener('click', async function () {
        const idea = input.value.trim();
        if (idea === '') {
            alert('Veillez remplir le champ !')
            return
        }

        // Ajout du message de l'utilisateur
        addMessage("Utilisateur", idea); 
        input.value = "";

        // Montrer la bulle de réflexion
        let thinkingBubble = showThinkingBubble();

        try {
            const res = await fetch(`https://api.jetcamer.com/ask-ai?question=en${encodeURIComponent(idea)}`);

            if (!res.ok) {
                // retirer le thinking
                responseDiv.removeChild(thinkingBubble);
                addMessage("Système", "❌ Erreur lors de l'envoi au webhook.", "error");
                return;
            }

            const reponseIA = await res.json();
            console.log(reponseIA);

            // Retirer le thinking
            responseDiv.removeChild(thinkingBubble);
            addMessage("Bot", reponseIA.answer || "⚠ Réponse pas affichée.");

        } catch (error) {
            console.error(error);
            responseDiv.removeChild(thinkingBubble);
            addMessage("Système", "⚠ Impossible de contacter le webhook.", "error");
        }
    });

    input.addEventListener('keypress', e => {
        if (e.key === 'Enter') button.click();
    });

    renderChat();
});