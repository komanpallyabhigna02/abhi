// Word Scramble - script.js
// Save as script.js and include in index.html

// Word lists by difficulty (can expand)
const WORDS = {
  easy: ["apple","house","green","river","chair","smile","light","train","apple","piano"],
  medium: ["garden","planet","coffee","butter","window","orange","castle","guitar","rocket"],
  hard: ["junction","elephant","dolphins","marvelous","algorithm","blueprint","sandstorm"]
};

const scrambledDiv = document.getElementById("scrambled");
const guessInput = document.getElementById("guess");
const checkBtn = document.getElementById("check-btn");
const clearBtn = document.getElementById("clear-btn");
const newWordBtn = document.getElementById("new-word");
const hintBtn = document.getElementById("hint-btn");
const skipBtn = document.getElementById("skip-btn");
const timerSpan = document.getElementById("timer");
const scoreSpan = document.getElementById("score");
const bestSpan = document.getElementById("best");
const difficultySelect = document.getElementById("difficulty");
const feedbackP = document.getElementById("feedback");
const wordLenSpan = document.getElementById("word-length");
const hintsUsedSpan = document.getElementById("hints-used");
const emojiContainer = document.getElementById("emoji-shower");

let currentWord = "";
let scrambled = [];
let score = 0;
let best = Number(localStorage.getItem("ws_best") || 0);
let timer = null;
let timeLeft = 30;
let hintsUsed = 0;

bestSpan.textContent = best;
scoreSpan.textContent = score;
hintsUsedSpan.textContent = hintsUsed;

// Utilities
function shuffleArray(a){
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(sec){
  const s = String(sec%60).padStart(2,"0");
  const m = Math.floor(sec/60);
  return `${String(m).padStart(2,"0")}:${s}`;
}

// Start a new word
function pickNewWord(){
  clearInterval(timer);
  feedbackP.textContent = "";
  hintsUsed = 0;
  hintsUsedSpan.textContent = hintsUsed;

  const difficulty = difficultySelect.value;
  const pool = WORDS[difficulty];
  currentWord = pool[Math.floor(Math.random()*pool.length)].toLowerCase();
  wordLenSpan.textContent = currentWord.length;

  // scramble (ensure not equal to original)
  let chars = currentWord.split("");
  do {
    chars = shuffleArray([...chars]);
  } while(chars.join("") === currentWord && currentWord.length>2);

  scrambled = chars;
  renderScrambled();
  guessInput.value = "";
  setTimeForDifficulty(difficulty);
  startTimer();
}

// Render scrambled letters as clickable tiles
function renderScrambled(){
  scrambledDiv.innerHTML = "";
  scrambled.forEach((ch, idx) => {
    const btn = document.createElement("div");
    btn.className = "letter";
    btn.textContent = ch.toUpperCase();
    btn.title = "Click to add";
    btn.dataset.index = idx;
    btn.addEventListener("click", () => {
      // append letter to input and hide tile
      guessInput.value += ch;
      btn.style.visibility = "hidden";
    });
    scrambledDiv.appendChild(btn);
  });
}

// Clear guess and restore tiles
function clearGuess(){
  guessInput.value = "";
  const tiles = scrambledDiv.querySelectorAll(".letter");
  tiles.forEach(t => t.style.visibility = "visible");
}

// Check guess
function checkGuess(){
  const val = guessInput.value.trim().toLowerCase();
  if(!val) { feedbackP.textContent = "Type or click letters to guess!"; feedbackP.style.color="#b33"; return; }

  if(val === currentWord){
    feedbackP.textContent = "🎉 Correct! Great job!";
    feedbackP.style.color="#0a7";
    awardPoints();
    launchEmojiShower();
    // update best
    if(score > best){ best = score; localStorage.setItem("ws_best", best); bestSpan.textContent = best; }
    // auto next after short delay
    setTimeout(pickNewWord, 1200);
  } else {
    feedbackP.textContent = "❌ Not quite — try again!";
    feedbackP.style.color="#b33";
    // slight penalty
    score = Math.max(0, score - 1);
    scoreSpan.textContent = score;
  }
}

// Award points depending on time left and hints used
function awardPoints(){
  let points = 10;
  points += Math.floor(timeLeft / 3); // faster = more points
  points -= hintsUsed * 2; // hints cost
  points = Math.max(1, points);
  score += points;
  scoreSpan.textContent = score;
}

// Hint: reveal one letter in the guess in correct position(s)
function giveHint(){
  if(hintsUsed >= currentWord.length) return;
  hintsUsed++;
  hintsUsedSpan.textContent = hintsUsed;
  // reveal first unrevealed position
  let guess = guessInput.value.split("");
  for(let i=0;i<currentWord.length;i++){
    if(guess[i] !== currentWord[i]){
      // ensure guess array has length
      if(guess.length < currentWord.length) while(guess.length < currentWord.length) guess.push("");
      guess[i] = currentWord[i];
      break;
    }
  }
  guessInput.value = guess.join("").slice(0,currentWord.length);
  // hide corresponding scrambled tiles that match those letters (first occurrences)
  const tiles = Array.from(scrambledDiv.querySelectorAll(".letter"));
  tiles.forEach(t => {
    if(t.style.visibility==="hidden") return;
    const ch = t.textContent.toLowerCase();
    // if that char is present in the guess now at a position, hide one tile of that char
    for(let i=0;i<guessInput.value.length;i++){
      if(guessInput.value[i] === ch){
        t.style.visibility = "hidden";
        break;
      }
    }
  });
}

// Skip the word (small penalty)
function skipWord(){
  score = Math.max(0, score - 3);
  scoreSpan.textContent = score;
  pickNewWord();
}

// Timer behaviour
function setTimeForDifficulty(diff){
  if(diff==="easy") timeLeft = 40;
  else if(diff==="medium") timeLeft = 30;
  else timeLeft = 20;
  timerSpan.textContent = formatTime(timeLeft);
}

function startTimer(){
  clearInterval(timer);
  timerSpan.textContent = formatTime(timeLeft);
  timer = setInterval(() => {
    timeLeft--;
    timerSpan.textContent = formatTime(timeLeft);
    if(timeLeft <= 0){
      clearInterval(timer);
      feedbackP.textContent = `⏱ Time's up! Word was "${currentWord.toUpperCase()}"`;
      feedbackP.style.color="#b33";
      // small penalty and autonew
      score = Math.max(0, score - 2);
      scoreSpan.textContent = score;
      setTimeout(pickNewWord, 1200);
    }
  }, 1000);
}

// Emoji shower (celebration)
function launchEmojiShower(){
  const emojis = ["🎉","✨","🥳","🎊","💫","🌟","🍾"];
  for(let i=0;i<28;i++){
    const e = document.createElement("div");
    e.className = "emoji";
    e.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    e.style.left = Math.random()*100 + "vw";
    e.style.fontSize = (Math.random()*18 + 18) + "px";
    e.style.animationDuration = (2.5 + Math.random()*1.5) + "s";
    e.style.animationDelay = (Math.random()*0.6) + "s";
    emojiContainer.appendChild(e);
    setTimeout(()=> e.remove(), 3800);
  }
}

// Event bindings
checkBtn.addEventListener("click", checkGuess);
clearBtn.addEventListener("click", clearGuess);
newWordBtn.addEventListener("click", pickNewWord);
hintBtn.addEventListener("click", giveHint);
skipBtn.addEventListener("click", skipWord);
difficultySelect.addEventListener("change", () => { pickNewWord(); });

// Allow keyboard Enter to check
guessInput.addEventListener("keydown", (e)=>{
  if(e.key === "Enter") checkGuess();
  if(e.key === "Backspace"){
    // if user erased, make hidden tiles visible again intelligently
    setTimeout(()=> {
      const visibleCount = Array.from(scrambledDiv.querySelectorAll(".letter")).filter(t=>t.style.visibility!=="hidden").length;
      // if too many hidden, restore all
      if(visibleCount < currentWord.length - (guessInput.value.length || 0)){
        scrambledDiv.querySelectorAll(".letter").forEach(t => t.style.visibility = "visible");
        // then hide letters that are present in the typed value (one per letter)
        const typed = guessInput.value.split("");
        const tiles = Array.from(scrambledDiv.querySelectorAll(".letter"));
        typed.forEach(ch => {
          const found = tiles.find(t => t.style.visibility!=="hidden" && t.textContent.toLowerCase() === ch.toLowerCase());
          if(found) found.style.visibility = "hidden";
        });
      }
    }, 10);
  }
});

// Init
pickNewWord();
