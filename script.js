const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const chatForm = document.querySelector(".chat-form");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const previewImg = fileUploadWrapper.querySelector("img");
const fileCancelButton = document.getElementById("file-cancel");
const chatbotToggler = document.getElementById("chatbot-toggler");
const closeChatbot = document.getElementById("close-chatbot");



const userData = {
  message: null,
  file: {
    data: null, 
    mime_type: null
  }
}

const InitialInputHeight = messageInput.scrollHeight;
const chatHistory = [];

//API setup
const API_KEY = "AIzaSyBW00k4wJ3VTsLO63JDvxRmEQ_chexp-J4";
 const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

//generate bot response using API
generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");

  // preparing message parts
  const parts = [{ text: userData.message }];

  if (userData.file.data) {
    if (userData.file.mime_type.startsWith("image/")) {
      // images it goes as inline_data
      parts.push({ inline_data: userData.file });
    } else if (userData.file.mime_type === "text/plain") {
      // text files goes as text
      parts.push({ text: userData.file.data });
    }
  }

  // save user message to chat history
  chatHistory.push({
    role: "user",
    parts
  });

  //API request options
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }]
    })
  };

  try {
    //fetch bot response from API
    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    const apiResponseText = data.candidates[0].content.parts[0].text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .trim();
    messageElement.innerText = apiResponseText;

    chatHistory.push({
      role: "model",
      parts: [{ text: apiResponseText }]
    });
  } catch (error) {
    console.log(error);
    messageElement.innerText = error.message;
    messageElement.style.color = "#ff0000";
  } finally {
    //Reset user's file data, removing thinking indicator and scroll chat to bottom
    userData.file = { data: null, mime_type: null };
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }
};


// create message element 
const createMessageElement = (content, classes) => {
  const div = document.createElement("div");
  div.classList.add("message", classes);

  
  // allow multiple classes separated by space
  classes.split(" ").forEach(c => {
    if (c.trim()) div.classList.add(c.trim());
  });
  div.innerHTML = content;
  return div;
};

// send user message and handle bot reply 
function sendUserMessage(text) {

  // create and append user message
  const messageContent = `
  <div class="message-text">
    ${text}
  </div>
  ${userData.file && userData.file.data 
    ? `<div class="attachment-wrapper">
         <img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />
       </div>` 
    : "" }`;


  const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight,behavior:"smooth"});
  chatBody.scrollTop = chatBody.scrollHeight;

  userData.message = text;
  
resetComposePreview();
// userData.file = { data: null, mime_type: null };


  // simulate bot thinking indicator after a short delay
  setTimeout(() => {
    const thinkingContent = `
      <svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
        <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"></path>
      </svg>
      <div class="message-text">
        <div class="thinking-indicator">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>`;

    const incomingMessageDiv = createMessageElement(thinkingContent, "bot-message", "thinking");
    incomingMessageDiv.classList.add("thinking");
    chatBody.appendChild(incomingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight,behavior:"smooth"});
    generateBotResponse(incomingMessageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    // replace thinking with the bot response after a random delay
    const randomDelay = Math.floor(Math.random() * 1000) + 1500; // 1500-2500ms
    setTimeout(() => {
      chatBody.scrollTop = chatBody.scrollHeight;
    }, randomDelay);
  }, 600);
}


// Prevent default form submit and handle submit only when user triggers it
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  sendUserMessage(text);
  messageInput.value = "";
});

// Handle Enter to send 
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;
    sendUserMessage(text);
    messageInput.value = "";
  }
});
//adjust unput field height dynamically
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${InitialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;
  document.querySelector(".chat-form").style.borderRadius = messageInput.scrollHeight > 
  InitialInputHeight ? "15px" : "32px";
});

//handle file input change and preview the selected file
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();

  if (file.type.startsWith("image/")) {
    // image case
    reader.onload = (e) => {
      fileUploadWrapper.querySelector("img").src = e.target.result;
      fileUploadWrapper.classList.add("file-uploaded");
      const base64String = e.target.result.split(",")[1];
      userData.file = {
        data: base64String,
        mime_type: file.type
      };
      fileInput.value = "";
    };
    reader.readAsDataURL(file);

  } else if (file.type === "text/plain") {
    //text file case
    reader.onload = (e) => {
      userData.file = {
        data: e.target.result,
        mime_type: "text/plain"
      };
      alert("text file ready to send");
      fileInput.value = "";
    };
    reader.readAsText(file);

  } else if (file.type === "application/pdf") {
  // pdf file case - extract text using pdf.js
  reader.onload = async (e) => {
    // show PDF icon in preview
    fileUploadWrapper.classList.add("file-uploaded");
    previewImg.src = "https://cdn-icons-png.flaticon.com/512/337/337946.png"; 
    previewImg.style.objectFit = "contain";

    // convert pdf to text
    const pdfData = new Uint8Array(e.target.result);
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    let extractedText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      extractedText += textContent.items.map(item => item.str).join(" ") + "\n";
    }

    userData.file = {
      data: extractedText,
      mime_type: "text/plain"
    };

    alert("pdf convert and ready to send");
    fileInput.value = "";
  };
  reader.readAsArrayBuffer(file);
  
  } else {
    alert("I cant support this type of file: " + file.type);
    fileInput.value = "";
  }
});

sendMessageButton.addEventListener("click", (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  sendUserMessage(text);
  messageInput.value = "";

  // reset file input and preview
  previewImg.src = "#";
  fileUploadWrapper.classList.remove("file-uploaded");
  // userData.file = { data: null, mime_type: null };
  fileInput.value = "";
});

//cancel file upload
fileCancelButton.addEventListener("click", () => {
  previewImg.src = "#"; 
  fileUploadWrapper.classList.remove("file-uploaded"); 
  userData.file = { data: null, mime_type: null }; 
  fileInput.value = ""; 
});

//initialize emoji picker and handle emoji selection
const picker = new EmojiMart.Picker({
  theme: "light",
  skinTonePosition:"none",
  previewPosition:"none",
  onEmojiSelect: (emoji) => {
    const {selectionStart: start, selectionEnd: end} = messageInput;
    messageInput.setRangeText(emoji.native, start, end, "end");
    messageInput.focus();
  },
  onClickOutside: (e) => {
    if(e.target.id === "emoji-picker"){
      document.body.classList.toggle("show-emoji-picker");
    } else{
      document.body.classList.remove("show-emoji-picker");
    }
  }
});


// reset compose area
function resetComposePreview() {
  previewImg.src = "#";
  fileUploadWrapper.classList.remove("file-uploaded");
  fileInput.value = "";
}

document.querySelector(".chat-form").appendChild(picker);
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());
chatbotToggler.addEventListener("click", () => document.body.classList.toggle
("show-chatbot"));
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
