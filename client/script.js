import bot from "./assets/bot.svg";
import user from "./assets/user.svg";
import speaker from "./assets/speaker.png";
import mute from "./assets/speaker.png";

const form = document.querySelector("form");
const chatContainer = document.querySelector("#chat_container");

const utterThis = new SpeechSynthesisUtterance();
const synth = window.speechSynthesis;

let loadInterval;
let speakingID;

function loader(element) {
  element.textContent = "";

  loadInterval = setInterval(() => {
    element.textContent += ".";

    if (element.textContent === "....") {
      element.textContent = "";
    }
  }, 300);
}

function typeText(element, text) {
  let index = 0;

  let interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 50);
}

function generateUniqueID() {
  const timeStamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timeStamp}-${hexadecimalString}`;
}

function useSound(id) {
  const elementText = document.getElementById(id);
  if (synth.speaking) {
    synth.cancel();
    if (id !== speakingID) {
      utterThis.text = elementText.innerHTML;
      synth.speak(utterThis);
    }
  } else {
    utterThis.text = elementText.innerHTML;
    synth.speak(utterThis);
  }

  speakingID = id;
}

function chatStripe(isAi, value, uniqueID) {
  let wrapper = document.createElement("div");
  wrapper.className = `wrapper ${isAi && "ai"}`;

  let chatWrapper = document.createElement("div");
  chatWrapper.className = "chat";
  chatWrapper.innerHTML = `
  <div class="profile">
    <img src="${isAi ? bot : user}" alt="${
    isAi ? "Bot Profile" : "User Profile"
  }" />
  </div>
  <div class="message" id=${uniqueID}>${value}</div>`;

  let speakerWrapper = document.createElement("div");
  speakerWrapper.className = "speaker-image";
  speakerWrapper.innerHTML =
    "speechSynthesis" in window && isAi && synth.speaking
      ? `<img src=${speaker} alt="speaker" />`
      : isAi && !synth.speaking
      ? `<img src=${mute} alt="speaker" />`
      : "";
  speakerWrapper.addEventListener("click", () => useSound(uniqueID));
  chatWrapper.appendChild(speakerWrapper);
  wrapper.appendChild(chatWrapper);

  return wrapper;
}

const handleSubmit = async (e) => {
  e.preventDefault();
  const data = new FormData(form);

  // User's ChatStripe
  chatContainer.appendChild(chatStripe(false, data.get("prompt")));

  form.reset();

  // Bot ChatStripe
  const uniqueID = generateUniqueID();
  chatContainer.appendChild(chatStripe(true, "", uniqueID));

  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueID);
  loader(messageDiv);

  // Fetch data from server
  const response = await fetch("https://chatgpt-codex-zwdk.onrender.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: data.get("prompt"),
    }),
  });

  clearInterval(loadInterval);
  messageDiv.innerHTML = "";
  if (response.ok) {
    const data = await response.json();
    const parsedData = data.bot.trim();

    // Start Speaking if possible
    utterThis.text = parsedData;
    // Check if bot is speaking then cancel that
    if (synth.speaking) {
      synth.cancel();
    }

    speakingID = uniqueID;
    synth.speak(utterThis);

    typeText(messageDiv, parsedData);
  } else {
    const err = await response.text();
    messageDiv.innerHTML = "Something went wrong";
    alert(err);
  }
};

form.addEventListener("submit", handleSubmit);
form.addEventListener("keydown", (e) => {
  if (e.keyCode === 13) {
    e.preventDefault();
    handleSubmit(e);
  }
});
