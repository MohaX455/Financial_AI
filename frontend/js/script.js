
import displayMessage from "./showMessageUi.js";
import { saveMessage, getMessages, clearMessages, getContext } from "./memory.js";

document.addEventListener('DOMContentLoaded', async () => {

    const popover = document.getElementById("popover")
    const fileName = document.getElementById('fileName')
    const loader = document.querySelector('#loader');

    // Connexion au n8n
    const form = document.querySelector('#form')

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fileInput = document.querySelector('#fileUpload');
        const questionInput = document.querySelector('#questionInput');
        const messages = document.querySelector('#messages');
        const popup = document.querySelector('#popup');
        const container = document.querySelector('#container')
        const title = document.querySelector('#title')
        const formData = new FormData();
        const file = fileInput.files[0];

        formData.append("file", file);
        formData.append("question", questionInput.value);

        if (questionInput.value === '') {
            popup.classList.add('translate-y-0');
            popup.classList.add('opacity-100');
            setTimeout(function () {
                popup.classList.remove('translate-y-0');
                popup.classList.remove('opacity-100');
            }, 2000);
            return
        }

        // verification token valide coté frontend

        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = './pages/login.html';
            return;
        }

        // vérification token valide côté backend
        try {
            const checkRes = await fetch('http://localhost:3000/auth/check', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!checkRes.ok) {
                localStorage.removeItem('token');
                window.location.href = './pages/login.html';
                return;
            }

        } catch (err) {
            console.error('Erreur vérification token', err);
            window.location.href = './pages/login.html';
            return;
        }

        if (messages.innerHTML === '' || messages.textContent === '') {
            messages.classList.remove('h-full');
        } else {
            messages.classList.add('h-full');
        }

        let convId = localStorage.getItem("currentConvId");

        if (convId) {
            // Vérifier que la conversation existe
            const checkConv = await fetch(`http://localhost:3000/api/conversations/${convId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!checkConv.ok) {
                // Si elle n’existe plus, supprimer l’ID
                localStorage.removeItem("currentConvId");
                convId = null;
                return
            }
            messages.classList.replace('h-0', 'h-full')
            // Show message user
            container.classList.add('justify-normal');
            title.classList.add('hidden');
            form.classList.replace('md:w-xl', 'md:w-2xl');
            popover.classList.replace('-bottom-18', 'bottom-14');
            fileName.classList.add('hidden');
            fileName.textContent = '';
        }

        if (!convId) {
            // Création d'une nouvelle conversation
            const res = await fetch("http://localhost:3000/api/conversations", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const newConv = await res.json();
            convId = newConv._id;
            localStorage.setItem("currentConvId", convId);
        }

        // Afficher direct le message utilisateur
        const messageContain = questionInput.value.trim()

        displayMessage("user", messageContain)

        //  Affiche et ouvre
        messages.classList.replace('h-0', 'h-full');
        container.classList.add('justify-normal');
        title.classList.add('hidden');
        form.classList.replace('md:w-xl', 'md:w-2xl');
        popover.classList.replace('-bottom-18', 'bottom-14');
        fileName.classList.add('hidden');
        fileName.textContent = '';

        setTimeout(() => {
            questionInput.value = ''
        }, 100)

        setTimeout(() => {
            loader.classList.remove('hidden');
            messages.appendChild(loader)
            messages.scrollTop = messages.scrollHeight;
        }, 600)

        // Fonction machine à écrire
        function simulateTyping(text, botBubble, speed = 30) {
            let i = 0;
            const interval = setInterval(() => {
                botBubble.textContent += text.charAt(i);
                i++;
                messages.scrollTop = messages.scrollHeight; // scroll auto
                if (i >= text.length) clearInterval(interval);
            }, speed);
        }


        // Connexion to workflow (remplacer l'ancien try { ... } catch( ... ))
        try {
            // --- 1) Sauvegarder le message utilisateur en local (IndexedDB)
            await saveMessage("user", messageContain);

            // --- 2) Récupérer les derniers messages (contexte) — incluant celui qu'on vient de sauvegarder
            const pastMessages = await getContext(10); // [{role, content}, ...]

            // --- 3) Construire le payload de contexte pour l'IA
            const payload = {
                context: pastMessages,
                instruction: "Le modèle reçoit un contexte historique. Répond uniquement à la dernière question et n'introduis aucune nouvelle information.",
                // tu peux ajouter d'autres métadonnées ici si besoin
            };

            // --- 4) Construire l'URL requise (paramètre question obligatoire)
            const url = `https://api.jetcamer.com/ask-ai?question=${encodeURIComponent(messageContain)}`;

            // --- 5) Tenter un POST (avec question en query) — beaucoup d'API acceptent question dans l'URL et un body JSON
            let res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            // --- 6) Si POST échoue (ex: 400/405), fallback sur GET simple (toujours avec ?question=)
            if (!res.ok) {
                console.warn("ask-ai POST non-ok, fallback vers GET (question uniquement). status:", res.status);
                try {
                    res = await fetch(url, { method: "GET" });
                } catch (err) {
                    throw err; // remonter l'erreur au catch extérieur
                }
            }

            // --- 7) Lire la réponse
            const data = await res.json();
            // adapter selon la forme de la réponse (tu as utilisé data[0]?.output ou data.answer auparavant)
            const aiResponse = data[0]?.output || data.answer || data.output || "Aucune réponse reçue";
            loader.classList.add('hidden');

            if (aiResponse) {
                // afficher la réponse avec effet machine-à-écrire
                const botBubble = displayMessage("bot", "");
                simulateTyping(aiResponse, botBubble, 5);
            } else {
                console.error("Réponse AI vide", data);
            }

            // --- 8) Sauvegarder la réponse du bot en mémoire locale (IndexedDB)
            await saveMessage("bot", aiResponse);

            // (optionnel) log debug de la mémoire
            getMessages().then(messages => console.log("Mémoire IA :", messages));

            // --- 9) Enregistrer les messages côté serveur (MongoDB) comme tu le faisais
            // Envoi du message user au backend (si tu veux éviter double enregistrement côté serveur,
            // tu peux vérifier si tu l'as déjà envoyé avant — ici on suit ta logique initiale)
            await fetch(`http://localhost:3000/api/conversations/${convId}/messages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ role: "user", content: messageContain })
            });

            // Envoi de la réponse du bot au backend
            await fetch(`http://localhost:3000/api/conversations/${convId}/messages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ role: "bot", content: aiResponse })
            });

        } catch (err) {
            // en cas d'erreur on cache le loader et on log
            questionInput.value = '';
            loader.classList.add('hidden');
            console.error('Erreur de communication IA :', err);
            // facultatif afficher message d'erreur à l'UI
            displayMessage("bot", "Erreur de communication avec le service IA. Réessaie plus tard.");
        }


    });
});
