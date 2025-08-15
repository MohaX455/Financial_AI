import displayMessage from "./showMessageUi.js";

document.addEventListener('DOMContentLoaded', async () => {

    const popover = document.getElementById("popover")
    const fileName = document.getElementById('fileName')


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

        // Show message user
        container.classList.add('justify-normal');
        title.classList.add('hidden');
        form.classList.remove('md:w-xl');
        form.classList.add('md:w-2xl');
        popover.classList.remove('-bottom-18');
        popover.classList.add('bottom-14');
        fileName.classList.add('hidden');
        fileName.textContent = '';

        // setTimeout(() => {
        //     // Message utilisateur
        //     let userBubble = `
        //             <div class='flex justify-end w-full'>
        //                 <p class='bg-[#444] py-2.5 px-5 w-fit rounded-[20px] max-w-[250px] md:max-w-[370px] min-w-[70px] flex flex-wrap break-words text-wrap justify-center items-center mr-0 md:mr-8 shadow-lg'>
        //                     ${questionInput.value.trim()}
        //                 </p>
        //             </div>
        //             `;
        //     messages.insertAdjacentHTML('beforeend', userBubble);
        //     messages.scrollTo({
        //         top: messages.scrollHeight,
        //         behavior: 'smooth'
        //     });
        // }, 500)



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
        displayMessage("user", messageContain);


        setTimeout(() => {
            questionInput.value = ''
        }, 500)

        // Enregistrer le message utilisateur en base
        await fetch(`http://localhost:3000/api/conversations/${convId}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ role: "user", content: messageContain })
        });

        // Connexion to workflow
        try {
            // const res = await fetch('https://api.jetcamer.com:8443/webhook/gestion_finance', {
            const res = await fetch(`https://api.jetcamer.com/ask-ai?question=${encodeURIComponent(messageContain)}`, {
                // const res = await fetch('http://localhost:5678/webhook-test/gestion_finance', {
                // method: 'POST',
                // body: formData
            });

            const data = await res.json();
            const aiResponse = data.answer
            console.log(data)

            if (res.ok) {

                // // Réponse IA 
                // setTimeout(function () {
                //     let botBubble = `
                //         <div class='flex justify-start w-full'>
                //             <p class='my-6'>
                //                 ${aiResponse}
                //             </p>
                //         </div>
                //         `;
                //     messages.insertAdjacentHTML('beforeend', botBubble);

                //     setTimeout(() => {
                //         messages.scrollTo({
                //             top: messages.scrollHeight,
                //             behavior: 'smooth'
                //         });
                //     }, 50);
                // }, 1500);

                

                // Afficher et enregistrer la réponse IA
                displayMessage("bot", aiResponse);

                await fetch(`http://localhost:3000/api/conversations/${convId}/messages`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ role: "bot", content: aiResponse })
                });

            } else {
                console.error('Echec du fetch');
            }
        } catch (err) {
            console.error('Erreur de verification :', err)
        }
    });
});
