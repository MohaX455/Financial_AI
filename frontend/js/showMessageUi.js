function displayMessage(role, content) {
    const messages = document.getElementById("messages");
    const escapedContent = content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")

    const bubbleContainer = document.createElement('div');
    const bubbleP = document.createElement('p');

    // const bubble = role === "user"
    //     ? `<div class='flex justify-end w-full'>
    //         <p class='bg-[#444] py-2.5 px-5 w-fit rounded-[20px] max-w-[250px] md:max-w-[370px] min-w-[70px] flex flex-wrap break-words text-wrap justify-center items-center mr-0 md:mr-8 shadow-lg'>
    //             ${escapedContent}
    //         </p>
    //     </div>`
    //     : `<div class='flex justify-start w-full'>
    //         <p class='my-6'>${escapedContent}</p>
    //     </div>`;

    bubbleContainer.className = role === "user" ? "flex justify-end w-full" : "flex justify-start w-full";

    bubbleP.className = role === "user" ? "bg-[#444] py-2.5 px-5 w-fit rounded-[20px] max-w-[250px] md:max-w-[370px] min-w-[70px] flex flex-wrap break-words text-wrap justify-center items-center mr-0 md:mr-8 shadow-lg" : "my-6";

    bubbleP.textContent = escapedContent;
    bubbleContainer.appendChild(bubbleP);
    messages.appendChild(bubbleContainer);
    // messages.insertAdjacentHTML('beforeend', bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubbleP;
}

export default displayMessage;

// Chargement historique au démarrage
(async () => {
    const token = localStorage.getItem("token");
    const messages = document.querySelector('#messages');
    const container = document.querySelector('#container');
    const title = document.querySelector('#title');
    const popover = document.getElementById("popover");
    const fileName = document.getElementById('fileName');
    const form = document.querySelector('#form');

    if (!token) {
        console.log('pas de token');
        messages.classList.replace('h-full', 'h-0'); // ferme si pas connecté
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/api/conversations", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
            console.error(`Erreur HTTP ${res.status} `);
            messages.classList.replace('h-full', 'h-0');
            return;
        }

        const convs = await res.json();

        if (Array.isArray(convs) && convs.length > 0) {
            const lastConv = convs[convs.length - 1];

            if (lastConv.messages.length > 0) {
                // Affiche et ouvre
                messages.classList.replace('h-0', 'h-full');
                container.classList.add('justify-normal');
                title.classList.add('hidden');
                form.classList.replace('md:w-xl', 'md:w-2xl');
                popover.classList.replace('-bottom-18', 'bottom-14');
                fileName.classList.add('hidden');
                fileName.textContent = '';

                messages.innerHTML = ''; // vide avant d'ajouter
                lastConv.messages.forEach(msg => displayMessage(msg.role, msg.content));

                localStorage.setItem("currentConvId", lastConv._id);
            } else {
                // Pas de messages
                messages.classList.replace('h-full', 'h-0');
                localStorage.removeItem("currentConvId");
            }
        } else {
            // Pas de conversation
            messages.classList.replace('h-full', 'h-0');
            localStorage.removeItem("currentConvId");
        }
    } catch (err) {
        console.error("Erreur chargement historique :", err);
        messages.classList.replace('h-full', 'h-0');
    }
})();
