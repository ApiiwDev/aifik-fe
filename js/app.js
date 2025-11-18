document.addEventListener("DOMContentLoaded", () => {
    let selection = "Human Resource and Finance";

    var notyf = new Notyf({
        duration: 2000,
        position: {
            x: "center",
            y: "center",
        },
        types: [
            {
                type: "loading",
                background: "#ffffff",
                color: '#000',
                icon: {
                    className: "loader",
                    tagName: "span",
                },
            },
            {
                type: "loader",
                background: "#fff",
                color: '#000',
                icon: {
                    className: 'video-loader',
                    tagName: 'video'
                }
            },
            {
                type: "success",
                background: "#76ABAE",
                color: '#fff'
            },
            {
                type: "error",
                background: "#D8000C",
                color: "#fff"
            }
        ],
    });

    console.log("Content Loaded..");

    const sentButton = document.getElementById("button_request");
    const voiceRequest = document.getElementById("voice_request");
    const user_input = document.getElementById("user_input");
    const user_space = document.querySelector(".user_space");
    const chatContainer = document.querySelector(".chat_container");
    const scrollDownBtn = document.querySelector(".scrollToBottom");
    const switcher = document.querySelector('.switcher');
    const mic_icon = document.getElementById("mic-icon");
    const welcome_text = document.getElementById('welcome_text');

    const maxRows = 6;
    const lineHeight = 24;

    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isListening = false;
    let isResponding = false;

    scrollDownBtn.style.display = "none";

    function checkTime(){
        const now = new Date();
        const hour = now.getHours();
        let greeting = '';

        if (hour >= 5 && hour < 12) {
            greeting = 'morning';
        } else if (hour >= 12 && hour < 17) {
            greeting = 'afternoon';
        } else if (hour >= 17 && hour < 21) {
            greeting = 'evening';
        } else {
            greeting = 'night';
        }

        if (welcome_text) {
            welcome_text.innerText = greeting;
        } else {
            console.warn('Elemen .welcome_text tidak ditemukan!');
        }
    }

    checkTime();

    const welcome = document.querySelector('.welcome');
    const width = welcome.offsetWidth/2;
    welcome.style.left = `calc(50% - ${width}px)`;

    function updateChatContainer(){
        const US = document.querySelector(".user_space");
        const container = document.querySelector('.container');

        if (!US || !container) return;

        const heightMap = {
            92: 110,
            112: 128,
            136: 153,
            160: 177,
            184: 200,
            188: 205,
        };

        const userHeight = US.clientHeight;
        
        if(document.querySelector('.welcome')){
            document.querySelector('.container').style.minHeight = `calc(50dvh - 94px)`;
            return;
        }

        const offset = heightMap[userHeight] ?? 110;

        container.style.minHeight = `calc(100vh - ${offset}px)`;
    }

    const scrollToBottom = () => {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: "smooth",
        });
    }

    const updateScrollButtonVisibility = () => {
        const scrollTop = chatContainer.scrollTop;
        const clientHeight = chatContainer.clientHeight;
        const scrollHeight = chatContainer.scrollHeight;

        const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
        const threshold = 15;
        const isAtBottom = Math.abs(distanceFromBottom) <= threshold;

        if (!isAtBottom) {
            scrollDownBtn.style.display = "block";
        } else {
            scrollDownBtn.style.display = "none";
        }
    }

    chatContainer.addEventListener("scroll", updateScrollButtonVisibility);

    scrollDownBtn.addEventListener("click", () => {
        scrollToBottom();
        updateScrollButtonVisibility();
    });

    scrollToBottom();

    window.addEventListener('resize', updateChatContainer);

    user_input.addEventListener("input", () => {
        user_input.style.height = "auto";

        const maxHeight = lineHeight * maxRows;

        if (user_input.scrollHeight <= maxHeight) {
            user_input.style.height = user_input.scrollHeight + "px";
            user_input.style.overflowY = "hidden";
        } else {
            user_input.style.height = maxHeight + "px";
            user_input.style.overflowY = "scroll";
        }

        updateChatContainer();
        scrollToBottom();
        updateScrollButtonVisibility();
    });

    user_input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (isResponding) return false;
            sentButton.click();
        }
    });

    const setAttribute = (state) => {
        if(state){
            sentButton.disabled = true;
            voiceRequest.disabled = true;
            isResponding = true;
        } else {
            sentButton.disabled = false;
            voiceRequest.disabled = false;
            isResponding = false;
        }
    }

    sentButton.addEventListener("click", async (e) => {
        e.preventDefault();

        if(document.querySelector('.welcome')){
            welcome.remove();
        }

        document.querySelector('.container').style.minHeight = 'calc(100vh - 110px)';

        setAttribute(true);
        
        const message = user_input.value.trim();
        if (message === "") {
            setAttribute(false);
            return;
        }

        const selfChat = document.createElement("div");
        selfChat.className = "self_request";
        selfChat.innerHTML = `
                <div class="chat_blob">
                    <p>${message}</p>
                </div>
            `;
        chatContainer.append(selfChat);
        scrollToBottom();
        updateScrollButtonVisibility();

        user_input.value = "";
        user_input.style.height = "auto";

        setTimeout(async () => {
            const container = createAIResponseBlob(chatContainer);
            scrollToBottom();
            updateScrollButtonVisibility();

            const dots = ["•", "••", "•••"];
            let dotIndex = 0;
            container.div.innerText = dots[dotIndex];

            const loadingInterval = setInterval(() => {
                dotIndex = (dotIndex + 1) % dots.length;
                container.div.innerText = dots[dotIndex];
            }, 400);

            const delay = Math.floor(Math.random() * 1000) + 500;
            await new Promise((resolve) => setTimeout(resolve, delay));

            const raw = await sendRequestToFlowise(message);

            const reply = formatBotResponse(raw);

            clearInterval(loadingInterval);
            container.div.innerHTML = "";

            const copyButton = createCopyButton();

            copyButton.btn.addEventListener("click", () => {
                copyButton.btn.disabled = true;
                copyText(container.div.innerText);
                setTimeout(() => {
                    copyButton.btn.disabled = false;
                }, 2000);
            });

            let index = 0;

            const tempEl = document.createElement("div");
            tempEl.innerHTML = reply;
            const plainText = tempEl.textContent;

            const typeInterval = setInterval(async () => {
                if (index < plainText.length) {
                    container.div.textContent += plainText[index];
                    index++;
                } else {
                    clearInterval(typeInterval);
                    setTimeout(() => {
                        setAttribute(false);
                    }, 2000);

                    container.div.innerHTML = reply;

                    copyButton.wrappper.appendChild(copyButton.btn);
                    container.chatBlob.appendChild(copyButton.wrappper);

                    const { element, promise } = await createFeedBackBlob(message);
                    chatContainer.append(element); 

                    const req = await postLogs({
                        user_request: message,
                        ai_response: plainText,
                        feedback: 'ignored'
                    });
                    
                    const finalFeedback = await promise;

                    if (finalFeedback !== 'ignored') {
                        const formData = new FormData();
                        formData.append('id', req.id);
                        formData.append('feedback', finalFeedback);
                        await axios.post(BASE_URL + 'admin/editLogsFeedback', formData);
                    }
                }
                updateChatContainer();
            }, 1);
        }, 500);
    });

    const postLogs = async (data) => {
        const formData = new FormData();
        formData.append('user_request', data.user_request);
        formData.append('ai_response', data.ai_response);
        formData.append('feedback', data.feedback || 'ignored');

        try {
            const response = await axios.post(BASE_URL + 'admin/postLogs', formData);

            if (response.data.status !== 201) {
                console.warn('Gagal menyimpan log:', response.data.message);
            }

            return response.data;
        } catch (error) {
            console.error('Terjadi error saat menyimpan log:', error);
        }
    }

    const createAIResponseBlob = (container) => {
        const aiChat = document.createElement("div");
        aiChat.className = "ai_response";

        const PhotoProfile = document.createElement("div");
        PhotoProfile.className = "PhotoProfile";
        const img = document.createElement("img");
        const targetImage = selection.toLowerCase().replace(/\s+/g, '_');
        img.src = "./assets/image/" + targetImage + ".png";
        img.alt = "AI Profile";
        img.className = "PhotoProfileImage";
        PhotoProfile.appendChild(img);
        aiChat.appendChild(PhotoProfile);

        const chatBlob = document.createElement("div");
        chatBlob.className = "chat_blob";

        const div = document.createElement("div");
        chatBlob.appendChild(div);
        aiChat.appendChild(chatBlob);
        container.append(aiChat);
        return { div, chatBlob };
    }

    const createFeedBackBlob = async (message) => {

        const feedbackBubble = document.createElement("div");
        feedbackBubble.className = "ai_response";

        const PhotoProfile = document.createElement("div");
        PhotoProfile.className = "PhotoProfile";

        const feedbackBlob = document.createElement("div");
        feedbackBlob.className = "chat_blob";

        const feedbackBox = document.createElement("div");
        feedbackBox.className = "feedback-box";

        const feedbackText = document.createElement("p");
        feedbackText.innerText = "Apakah Anda puas dengan jawaban ini?";
        feedbackText.style.marginBottom = "5px";

        const buttonWrapper = document.createElement("div");
        buttonWrapper.style.display = "flex";
        buttonWrapper.style.gap = "10px";

        const yesButton = document.createElement("button");
        yesButton.innerText = "Iya";
        yesButton.className = "feedback-btn";

        const noButton = document.createElement("button");
        noButton.innerText = "Tidak";
        noButton.className = "feedback-btn";

        buttonWrapper.appendChild(yesButton);
        buttonWrapper.appendChild(noButton);
        feedbackBox.appendChild(feedbackText);
        feedbackBox.appendChild(buttonWrapper);
        feedbackBlob.appendChild(feedbackBox);
        feedbackBubble.appendChild(PhotoProfile);
        feedbackBubble.appendChild(feedbackBlob);

        scrollToBottom();
        updateScrollButtonVisibility();

        const loader = document.createElement('span');
        loader.className = 'loader';

        let resolved = false;
        let feedback = 'ignored';
        let resolveFn;

        const promise = new Promise((resolve) => {
            resolveFn = resolve;
        });

        const safeResolve = () => {
            if (!resolved) {
                resolved = true;
                resolveFn(feedback);
            }
        };

        yesButton.onclick = () => {
            feedback = 'like';
            feedbackText.innerText = "Terima kasih atas tanggapan Anda!";
            buttonWrapper.innerHTML = '';
            feedbackBox.appendChild(loader);
            safeResolve();
            loader.remove();
        };

        noButton.onclick = async () => {
            feedback = 'dislike';
            feedbackText.innerText = "Maaf jika jawabannya kurang memuaskan.";
            buttonWrapper.innerHTML = '';
            feedbackBox.appendChild(loader);
            const procces = await postUnansweredQuestion(message);
            if(procces){
                directMessage(selection);
            }
            safeResolve();
            loader.remove();
        };

        setTimeout(safeResolve, 30_000);

        return { element: feedbackBubble, promise };
    }

    const createCopyButton = () => {
        const wrappper = document.createElement("div");
        const copyButton = document.createElement("button");
        const spanText = document.createElement("span");
        const spanVoid = document.createElement("span");
        wrappper.classList = 'wrapper-copy';

        copyButton.className = "copy-btn";
        spanText.innerHTML = '<i class="bx bx-copy-alt"></i>';

        copyButton.appendChild(spanText);
        copyButton.appendChild(spanVoid);
        
        return { btn: copyButton, wrappper };
    }

    const copyText = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            notyf.success('Copied');
        }).catch(() => {
            notyf.success('Failed');
        });
    }

    const formatBotResponse = (text) => {
        if (!text || typeof text !== "string") {
            return "<p class='text-response text-error'>[Jawaban tidak valid]</p>";
        }

        text = text.replace(/^\*\*(.+?):\*\*$/gm, "<h1 class='header-1-response'>$1:</h1><hr class='header-hr' />");
        text = text.replace(/^\*(.+?):\*$/gm, "<h2 class='header-2-response'>$1:</h2><hr class='header-hr' />");
        text = text.replace(/\*\*(.+?)\*\*/g, "<b class='bold-response'>$1</b>");
        text = text.replace(/_(.+?)_/g, "<i class='italic-response'>$1</i>");
        text = text.replace(/\[([^\]]+?)\]\((https?:\/\/[^\s)]+)\)/g, "<a class='link-response' href='$2' target='_blank' rel='noopener noreferrer'>$1</a>");
        text = text.replace(/(?<!["'>])(\bhttps?:\/\/[^\s<>"'()]+(?:\.[^\s<>"'()]+)*)(?=\b|[\s\.,;!?])/g, (match) => {
            if (text.includes(`href="${match}"`) || text.includes(`href='${match}'`)) {
                return match;
                }
                return `<a class='link-response' href='${match}' target='_blank' rel='noopener noreferrer'>${match}</a>`;
            }
        );

        const lines = text.split("\n");
        let inUl = false;
        let inOl = false;
        let formatted = "";
        let paragraphBuffer = [];

        function flushParagraph() {
            if (paragraphBuffer.length > 0) {
                const paragraphText = paragraphBuffer.join(" ").trim();
                if (paragraphText) {
                    formatted += `<p class="text-response">${paragraphText}</p>`;
                }
                paragraphBuffer = [];
            }
        }

        lines.forEach((line) => {
            line = line.trim();

            if (line.startsWith("*")) {
                line = line.substring(1).trim();
            }

            const isUl = line.startsWith("- ");
            const isOl = /^\d+\.\s/.test(line);

            if (isUl) {
                flushParagraph();
                if (!inUl) {
                    if (inOl) {
                        formatted += "</ol>";
                        inOl = false;
                    }
                    inUl = true;
                    formatted += "<ul class='ul-response'>";
                }
                formatted += `<li class='li-response'>${line.slice(2).trim()}</li>`;
            } else if (isOl) {
                flushParagraph();
                if (!inOl) {
                    if (inUl) {
                        formatted += "</ul>";
                        inUl = false;
                    }
                    inOl = true;
                    formatted += "<ol class='ol-response'>";
                }
                formatted += `<li class='li-response'>${line.replace(/^\d+\.\s/, "").trim()}</li>`;
            } else {
                if (inUl) {
                    formatted += "</ul>";
                    inUl = false;
                }
                if (inOl) {
                    formatted += "</ol>";
                    inOl = false;
                }
                if (line === "") {
                    flushParagraph();
                } else {
                    paragraphBuffer.push(line);
                }
            }
        });

        flushParagraph();

        if (inUl) formatted += "</ul>";
        if (inOl) formatted += "</ol>";

        return formatted;
    }

    const sendRequestToFlowise = async (text) => {
        try {
            const url = BASE_URL + "engine/request";

            let targetSelection;

            if(selection.toLocaleLowerCase().replace(/\s+/g, "_") === 'human_resource_and_finance'){
                targetSelection = 'hr_and_finance';
            } else {
                targetSelection = selection.toLocaleLowerCase().replace(/\s+/g, "_");
            }

            const response = await axios.post(url, {
                question: {
                    text: text,
                    selection: targetSelection
                }
            }, {
                headers: {
                    "Content-Type": "application/json"
                }
            });

            console.log(response);

            return response.data.text;
             
        } catch (err) {
            console.error(err);
            return "Maaf, terjadi kesalahan dalam sistem. Silakan coba lagi.";
        }
    }

    const options = [
        { icon: "bx-user-circle", text: "Human Resource and Finance" },
        { icon: "bx-book", text: "Academic Service" },
        { icon: "bx-desktop", text: "Laboratory" }
    ];

    const switching = (target, e) => {
        if(target === selection) return false;

        document.querySelectorAll('[id^="switcher_button_"]').forEach(btn => {
            btn.removeAttribute('data-selected');
            btn.disabled = true;
        });

        const filteredTarget = target.toLowerCase().replace(/\s+/g, '_');
        const selectedButton = document.getElementById(`switcher_button_${filteredTarget}`);

        if (selectedButton) {
            selectedButton.setAttribute('data-selected', 'true');


            // Swal.fire({
            //     html: `
            //     <img width="100%" src="assets/image/hing.gif"/>
            //     `,
            //     background: 'transparent',
            //     backdrop: 'rgba(0, 0, 0, 0.4)',
            //     showCloseButton: false,
            //     showConfirmButton: false,
            //     width: 600,
            //     timer: 2000,
            //     timerProgressBar: false,
            //     allowOutsideClick: false,
            //     allowEscapeKey: false,
            //       customClass: {
            //         popup: 'swal2-mini'
            //     }
            // });


            sentButton.disabled = true;
            voiceRequest.disabled = true;
            user_input.disabled = true;

            selection = target;

            setTimeout(() => {
                notyf.success("Berhasil diganti ke: " + target);
                
                setTimeout(() => {
                    document.querySelectorAll('[id^="switcher_button_"]').forEach(btn => {
                        btn.disabled = false;
                    });
                    sentButton.disabled = false;
                    voiceRequest.disabled = false;
                    user_input.disabled = false;
    
                    chatContainer.innerHTML = `<div class='welcome'>
                        <h1 id='welcome_text'></h1>
                    </div>`;
                    
                    requestAnimationFrame(() => {
                        checkTime();
                    })
                }, 2000);

            }, 2000);
        }
    }

    options.map((title) => {
        const button = document.createElement('button');
        const filteredTitle = title.text.toLowerCase().replace(/\s+/g, '_');
        button.id = 'switcher_button_' + filteredTitle;

        if (title.text === selection) {
            button.setAttribute('data-selected', 'true');
        }

        const textNode = document.createTextNode(title.text);
        const i = document.createElement('i');
        i.className = `bx ${title.icon}`;

        button.onclick = (e) => switching(title.text, e);

        button.append(i);
        button.append(textNode);

        switcher.append(button);
    });

    const directMessage = (name, message) => {

        const now = new Date();
        const hour = now.getHours();
        let greeting = '';

        if (hour >= 5 && hour < 12) {
            greeting = 'Selamat pagi';
        } else if (hour >= 12 && hour < 15) {
            greeting = 'Selamat Siang';
        } else if (hour >= 15 && hour < 18) {
            greeting = 'Selamat Sore';
        } else {
            greeting = 'Selamat Malam';
        }

        const formatMessage = encodeURIComponent(`${greeting} Pak, mohon maaf mengganggu waktunya 🙏, izin bertanya terkait '${message}', Terima kasih sebelumnya.`);

        switch (name) {
            case "Human Resource and Finance":
                window.open(`https://api.whatsapp.com/send?phone=6281223417590&text=${formatMessage}`, '_blank');
                break;
            case "Academic Service":
                window.open(`https://api.whatsapp.com/send?phone=6285314940888&text=${formatMessage}`, '_blank');
                break;
            case "Laboratory":
                window.open(`https://api.whatsapp.com/send?phone=6281312494350&text=${formatMessage}`, '_blank');
                break;
        }
    }

    const postUnansweredQuestion = async (question) => {
        try {
            const targetSelection = selection.toLowerCase().replace(/\s+/g, '_');
            const formData = new FormData();

            formData.append('text',  question);
            formData.append('selection', targetSelection);

            const response = await axios.post(BASE_URL + 'admin/postunanswered', formData);

            if(response.data.status == 500 || response.data.status == 400){
                notyf.error(response.data.message);
                return false;
            }
            return true;
        } catch (err) {
            console.log(err);
            notyf.error(err.message);
            return false;
        }
    }

    voiceRequest.addEventListener('click', (e) => {
        notyf.error("Soon...");
    })
});
