document.addEventListener('DOMContentLoaded', () => {

    const toggleBtn = document.getElementById("togglePopover");
    const popover = document.getElementById("popover");
    const fileUpload = document.getElementById('fileUpload')
    const fileName = document.getElementById('fileName')
    const MAX_LENGTH = 45;
    const connect = document.querySelector('#connect')
    const messages = document.querySelector('#messages')
            const container = document.querySelector('#container')
        const title = document.querySelector('#title')
        const form = document.querySelector('#form')

    connect.addEventListener('click', function () {
        window.location.href = './pages/login.html'
    })

    fileUpload.addEventListener("change", () => {
        const file = fileUpload.files[0];

        if (file) {
            const fullName = file.name;
            const shortName = fullName.length > MAX_LENGTH
                ? fullName.substring(0, MAX_LENGTH) + "..."
                : fullName;

            fileName.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="lucide lucide-file-icon lucide-file">
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                </svg>
                <span title='${fullName}'>${shortName}</span>
                <i id="cross_filename" class="fa-solid fa-xmark absolute right-2 top-1/2 -translate-y-1/2 z-50 cursor-pointer text-[16px] text-[rgba(255_255_255_/_0.6)] hover:text-[rgba(255_255_255_/_0.8)]"></i>
                `;
            fileName.classList.remove('hidden');
            popover.classList.add("hidden");
        } else {
            fileName.textContent = '';
            fileName.classList.add('hidden');
        }
    });
    fileName.addEventListener("click", (e) => {
        if (e.target && e.target.id === "cross_filename") {
            fileName.classList.add('hidden');
            fileUpload.value = "";
        }
    });


    document.addEventListener("click", (event) => {
        if (toggleBtn.contains(event.target)) {
            popover.classList.toggle("hidden");
        } else if (!popover.contains(event.target)) {
            popover.classList.add("hidden");
        }
    });

    // fetch pour nom d'utilisateur
    const token = localStorage.getItem("token");
    const userInfo = document.querySelector('#userInfo');
    const logout = document.querySelector('#logout');

    if (token) {
        fetch("http://localhost:3000/profile", {
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Token invalide ou expiré");
                }
                return res.json();
            })
            .then(user => {
                connect.classList.add('hidden');
                userInfo.classList.remove('hidden', 'hidden');
                userInfo.classList.add('flex');
                document.getElementById("username").textContent = user.name;

                // Bouton logout
                const logoutBtn = document.getElementById("logoutBtn");
                logoutBtn.addEventListener('click', () => {
                    localStorage.removeItem("token");
                    connect.classList.remove('hidden');
                    userInfo.classList.add('hidden');
                    logout.classList.add('hidden');
                    messages.innerHTML = ''
                    //  Affiche et ouvre
                    messages.classList.replace('h-full', 'h-0');
                    container.classList.replace('justify-normal', 'justify-center');
                    title.classList.remove('hidden');
                    form.classList.add('md:w-xl');
                    popover.classList.remove('bottom-14');
                    fileName.classList.add('hidden');
                    fileName.textContent = '';
                });
            })
            .catch(err => {
                console.log(err.message);
                localStorage.removeItem("token");
                connect.classList.remove('hidden');
                userInfo.classList.add('hidden');
            });
    } else {
        connect.classList.remove('hidden');
        userInfo.classList.add('hidden');
    }

})