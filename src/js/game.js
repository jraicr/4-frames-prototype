/**
 *
 * Crear formulario con input y pista donde el usuario deba adivinar la palabra en un tiempo determinado.
 * Si lo acierta se abre nueva ventana informando del acierto.
 *
 * Retos propuestos: Utilización de setInterval, setTimeout, construcción de
 * elementos dinámicos en el DOM.
 *
 * @author J. Rai <jraicr@gmail.com>
 *
 * */

// import frame from "@/assets/frame-1.webp";

const output = document.querySelector(".output");
const userInputContainer = document.getElementById("user-input-container");
const rulesContainer = document.querySelector(".rules");
const picsContainer = document.querySelector(".pic-container");
const buttonGameLauncher = document.getElementById("game-launcher");

const timerTitleContainer = document.querySelector(".timer-container");
const timerCountdownContainer = document.getElementById("timer-countdown");
const triesContainer = document.querySelector(".tries-container");
const triedWordsListContainer = document.querySelector(".tried-words");

// Elementos creados dinamicamente mas adelante
let userInput, sendButton, triesParagraph, containerPicLinks;

const pictureList = [];
const pictureButtonList = [];
const triedWords = [];

// Valores mínimos y máximos para el contador
const initialCounterValue = 120;
const finalCounterValue = 0;

// Penalización de segundos por respuesta fallida
const counterPenalize = 10;

let currentTries = 0;
const maxTries = 4;

// Variables de contador y timeout
let currentTimerValue, counterUpdateInterval, outputTimeoutRemover;

const gameState = {
  Waiting: "waiting",
  Playing: "playing",
  Win: "win",
  Lost: "lost",
};

let currentGameState = gameState.Waiting;

const rightWordEs = "El club de la lucha";
const rightWordEn = "Fight Club";

awake();

function getImageUrl(name, ext) {
  return new URL(`../assets/images/${name}.${ext}`, import.meta.url).href;
}

function awake() {
  buttonGameLauncher.addEventListener("click", () => {
    initGame();
  });
}
// Inicializa el juego
function initGame() {
  buttonGameLauncher.remove();
  rulesContainer.remove();
  createGameElements();
  startCounter();
  currentGameState = gameState.Playing;
}

// Actualiza el contador
function updateCounter() {
  if (currentTimerValue > finalCounterValue) {
    const str = `${currentTimerValue} segundos`;

    writeInDiv(timerCountdownContainer, str);

    currentTimerValue--;
  } else {
    timeIsOver();
  }
}

function startCounter() {
  currentTimerValue = initialCounterValue;
  counterUpdateInterval = setInterval(updateCounter, 1000);
}

function stopCounter() {
  clearInterval(counterUpdateInterval);
}

function timeIsOver() {
  stopCounter();

  const str = "Tiempo agotado.";
  output.style.color = "var(--error)"; // Variamos al color de error
  writeInDiv(output, str);

  clearTimeout(clearTimeout(outputTimeoutRemover));

  finishGame(false);
}

function maxTriesReached() {
  stopCounter();
  clearTimeout(clearTimeout(outputTimeoutRemover));

  const str = "Intentos agotados";
  writeInDiv(output, str);

  finishGame(false);
}

function finishGame(success) {
  disableControls();

  // Boramos contenedor de tiempo
  timerTitleContainer.remove();
  triesContainer.remove();
  userInputContainer.remove();
  output.remove();

  if (success) {
    currentGameState = gameState.Win;
  } else {
    currentGameState = gameState.Lost;
  }

  // Calculamos tiempo empleado para usar en estadisticas
  const elapsedTime = initialCounterValue - currentTimerValue;

  const outResults = document.getElementById("output-results");
  showResults(outResults, elapsedTime);
}

// Ejecutado con el botón del formulario, comprueba si la respuesta del usuario coincide con la respuesta correcta y
// gestiona la lógica de finalizar el juego o penalizar el intento.

// Devuelve true si el usuario acertó y false en caso contrario.
function tryWord(wordGuess) {
  userInput.value = ""; // Borramos el texto introducido en el campo de texto

  // Limpiamos espacios en ambos strings
  let cleanedUserGuess = wordGuess.replace(/ /g, "");
  let cleanedRightWordEs = rightWordEs.replace(/ /g, "");
  let cleanedRightWordEn = rightWordEn.replace(/ /g, "");

  // Convertimos en minusculas
  cleanedUserGuess = cleanedUserGuess.toLowerCase();
  cleanedRightWordEs = cleanedRightWordEs.toLowerCase();
  cleanedRightWordEn = cleanedRightWordEn.toLowerCase();

  // Comparamos
  const guessed =
    cleanedRightWordEs === cleanedUserGuess ||
    cleanedRightWordEn === cleanedUserGuess;

  if (guessed) {
    // Lógica de exito
    stopCounter();
    finishGame(true);
  } else {
    // Lógica de intento fallido
    badTry(wordGuess);
  }

  return guessed;
}

function badTry(wordGuess) {
  triedWords.push(wordGuess);

  // Comprobamos si esta vacio y lo reescribimos como saltado
  if (wordGuess.trim().length === 0) {
    wordGuess = "<i>[Saltado]</i>";
  }

  // Actualizamos intentos y lo escribimos
  currentTries++;
  triesParagraph.innerHTML = `${currentTries}/${maxTries} Intentos`;

  triedWordsListContainer.innerHTML += `<li class='tryList'>${wordGuess}</li>`;

  const lastTry = currentTries === maxTries - 1;

  if (!lastTry) {
    output.innerHTML = "No has acertado";
  } else {
    output.innerHTML = "El último intento";
  }

  // Limpiamos el timeout por si existía previamente
  if (outputTimeoutRemover != null) {
    clearTimeout(outputTimeoutRemover);
  }

  if (!lastTry) {
    // Establecemos un timeout para borrar el texto escrito en el output
    outputTimeoutRemover = setTimeout(
      clearTimeoutDivElement,
      2000,
      output,
      outputTimeoutRemover
    );
  } else {
    // El texto del ultimo intento se muestra rojo y dura tanto como tiempo le quede al usuario.
    output.style.color = "var(--error)";
    outputTimeoutRemover = setTimeout(
      clearTimeoutDivElement,
      currentTimerValue * 1000,
      output,
      outputTimeoutRemover
    );
  }

  // Cargamos nueva imagen
  const newFrame = addNewFrame();

  if (newFrame > 0) {
    setPicture(newFrame);
  }

  // Actualizamos contador con la penalización por el fallo
  currentTimerValue -= counterPenalize;

  // Escribimos inmediatamente los segundos una vez modificado por la penalización
  if (currentTimerValue > 0) {
    const str = `${currentTimerValue} segundos`;
    writeInDiv(timerCountdownContainer, str);
  } else {
    // Procuramos que al penalizar no alcance números negativos
    currentTimerValue = 0;
  }

  // Comprobamos si se ha producido el máximo de intentos
  if (currentTries === maxTries) {
    maxTriesReached();
  }
}

function createGameElements() {
  // Creamos el contenedor de la primera imagen
  const containerSinglePic = document.createElement("div");
  containerSinglePic.classList.add("pictureSlide");

  // Cargamos la primera imagen que mostraremos
  const pictureFrame = document.createElement("img");
  pictureFrame.src = getImageUrl("frame-1", "webp");
  pictureFrame.id = "movie-picture";

  pictureList.push(pictureFrame);

  // Creamos el contenedor div de los enlaces a las imagenes
  containerPicLinks = document.createElement("div");
  containerPicLinks.id = "container-pic-links";

  // Boton para cambiar imagen
  const firstPicBtn = document.createElement("a");
  firstPicBtn.innerHTML = "1";
  firstPicBtn.href = "#";
  firstPicBtn.classList.add("active");

  firstPicBtn.addEventListener("click", () => {
    setPicture(1);

    pictureButtonList.forEach((value) => {
      value.classList.remove("active");
    });

    firstPicBtn.classList.add("active");
  });

  pictureButtonList.push(firstPicBtn);

  // Intentos
  triesParagraph = document.createElement("p");
  triesParagraph.innerHTML = `0/${maxTries} Intentos`;

  // Titulo contador
  const timerTitle = document.createElement("p");
  timerTitle.innerHTML = "Tiempo";

  // Formulario
  const form = document.createElement("form");
  form.onsubmit = onGuessing;

  // Label del input
  // let guessLabel = document.createElement("label");
  // guessLabel.htmlFor = "wordGuessed";
  // guessLabel.innerHTML = "Adivina";

  // Input
  userInput = document.createElement("input");
  userInput.id = "word-guessed";
  userInput.type = "text";
  userInput.autocomplete = "off";
  userInput.placeholder = "Adivina la película";

  // Botón
  sendButton = document.createElement("button");
  sendButton.type = "button";
  sendButton.id = "try-word-button";
  sendButton.onclick = onGuessing;
  sendButton.innerHTML = "Enviar";
  sendButton.classList.add("send-button");

  // Insertamos contenedor, primera imagen y enlace en DOM
  containerPicLinks.appendChild(firstPicBtn);
  containerSinglePic.appendChild(pictureFrame);
  picsContainer.appendChild(containerSinglePic);
  picsContainer.appendChild(containerPicLinks);

  // triesContainer.appendChild(triesParagraph);
  triesContainer.insertBefore(triesParagraph, triedWordsListContainer);

  // Nos aseguramos de que al introducir el titulo se situe sobre el nodo
  // del div donde se muestra la cuenta atrás
  timerTitleContainer.insertBefore(timerTitle, timerCountdownContainer);

  // Metemos todos los elementos en el nodo del formulario
  // form.appendChild(guessLabel);
  form.appendChild(userInput);
  form.appendChild(sendButton);

  userInputContainer.appendChild(form);

  // Hacemos visible el contenedor de intentos
  triesContainer.style.visibility = "unset";

  // hacemos visible el contenedor del contador
  timerTitleContainer.style.visibility = "unset";
}

function addNewFrame() {
  let currentFrame = -1;

  if (pictureList.length < maxTries) {
    currentFrame = pictureList.length + 1;

    // Creamos el contenedor de la primera imagen
    const containerSinglePic = document.createElement("div");
    containerSinglePic.classList.add("pictureSlide");

    // Cargamos imagen
    const pictureFrame = document.createElement("img");
    pictureFrame.src = getImageUrl(`frame-${currentFrame}`, "webp");
    pictureFrame.id = "movie-picture";

    // Actualizamos lista
    pictureList.push(pictureFrame);

    // Boton para cambiar imagen
    const newPicBtn = document.createElement("a");
    newPicBtn.innerHTML = currentFrame;
    newPicBtn.href = "#";

    newPicBtn.addEventListener("click", () => {
      setPicture(currentFrame);

      // Borramos la clase 'active' de los anteriores botones y procuramos que el nuevo sea el activado
      // cuando se hace click en el botón
      pictureButtonList.forEach((value) => {
        value.classList.remove("active");
      });

      newPicBtn.classList.add("active");
    });

    // Borramos actualmente el estado activo del resto de botones y se lo añadimos al nuevo
    pictureButtonList.forEach((value) => {
      value.classList.remove("active");
    });

    newPicBtn.classList.add("active");

    pictureButtonList.push(newPicBtn);

    // Insertamos nodos de nueva imagen
    containerSinglePic.appendChild(pictureFrame);
    containerPicLinks.appendChild(newPicBtn);
  }

  return currentFrame;
}

function setPicture(frame) {
  const currentPic = document.getElementById("movie-picture");

  if (currentPic) {
    currentPic.src = pictureList[pictureList.length - 1].src;
  }
}

// Habilita los controles del usuario
// function enableControls() {
//   userInput.disabled = false;
//   sendButton.disabled = false;
// }

// Deshabilita los controles del usuario
function disableControls() {
  userInput.disabled = true;
  sendButton.disabled = true;
}

// Usado para llamarse desde un Timeout
function clearTimeoutDivElement(divElement, timer) {
  divElement.innerHTML = "";
  clearTimeout(timer);
}

// Dado un elemento html escribe en su
function writeInDiv(divElement, text, keepLast = false) {
  if (keepLast) {
    divElement.innerHTML += text;
  } else {
    divElement.innerHTML = text;
  }
}

function onGuessing(e) {
  // if (userInput.value) {
  tryWord(userInput.value);
  // }

  if (e.target.type !== sendButton.type) {
    return false;
  }
}

function showResults(outputContainer, elapsedTime) {
  let triesTextResults = `${currentTries} intentos.`;

  if (currentTries === 0) {
    triesTextResults = "A la primera! WOW!";
  }

  switch (currentGameState) {
    case "win": {
      const winnerText = `<h1>¡Acertaste la película!</h1>
                        <h2>Estadísticas:</h2>
                        <li><Strong>Tiempo empleado:</Strong> ${elapsedTime} segundos. </li>
                        <li><Strong>Nº de intentos antes de acertar:</Strong> ${triesTextResults} </li>`;
      writeInDiv(outputContainer, winnerText);

      break;
    }

    case "lost": {
      let posterImgPath = getImageUrl("poster", "webp");
      const lostText = `<h1>Oh! Perdiste!</h1> <p><strong>La película era:</strong> "${rightWordEs}" o "${rightWordEn}" </p> <img width="640" src='${posterImgPath}'>`;
      writeInDiv(outputContainer, lostText);
      break;
    }
  }
}
