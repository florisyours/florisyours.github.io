// what only 1 web programming class does to a mf. ugly code and structure ahead!!! i did not care enough

import { fetchPossibleMaps, compareMap } from './mapsv2.js';
import { saveState, loadState } from './storagev2.js'
var allMaps = [];
var possibleMaps = [];
var guessableMaps = [];
var correctMap = {};

// Get references to the input element and suggestions container
const inputElement = document.querySelector('.input');
const suggestionsElement = document.querySelector('.suggestions');
const easyModeButton = document.querySelector('.easy-mode-button');

// top map of suggestions for if they press enter
let topSuggestion;
let easyModeAtStep = 0;
let guessNumber = 1;
const maxGuesses = 10;
const scoreForYellowSquare = 3;
const msToDaysRatio = 1000 * 60 * 60 * 24;
// update this once in a while for new maps to come in
const mapCutOff = 710;

// seed for randomizer
let mapSeed = 9325098;

// start date in UTC
const firstDay = new Date("2024-12-21T00:00:00Z");
const now = new Date();

console.log(firstDay)
console.log(now)

let gameNumber = Math.ceil((now - firstDay) / msToDaysRatio);
console.log(`This is game number ${gameNumber}!`);

const titleTextElement = document.querySelector('.title__text');
titleTextElement.textContent = `Minrle #${gameNumber}`;

fetchPossibleMaps().then((maps) => {
    allMaps = maps.allMaps;
    possibleMaps = maps.possibleMaps;
    guessableMaps = maps.allMaps;
  
    correctMap = getMapOfTheDay(gameNumber);

    // load state
    let guesses = getGuesses();

    if (guessNumber > 1) {
        console.log("Loaded guesses:", guesses);

        guesses.forEach((guess) => createGuess(guess, false))
        //update guesses text
        updateGuesses();
        checkCorrectOrOutOfGuesses(guesses[guesses.length - 1], false);

    }

    // disable button if easy mode is enabled
    if (easyModeAtStep > 0) {
        disableEasyModeButton();
    }

    // debug: find map of the day for each day
    /*
    for (let i = 0; i < 750; i++) {
        console.log(`${i}: ${getMapOfTheDayTwo(i).Name}`);
    }*/
});

// OLD VERSION
//function getMapOfTheDay(number) {
    /* spoilers to the right, do not look!!!!                                                                                                                                                                                                                                            */let firstCorrectMaps = ["Haunted Tower", "Egghunt 3", "Blight", "Jiga's Claymaze", "Chaoskampf", "E", "Trick or Treat", "Its Better Together", "Resource Parkour", "Bugs", "Minas Tirith", "Factory", "Uluru", "Super Minr Kart", "Mean Messages 2: Electric Boogaloo", "Wolly Mammoth", "Retro Runner Tapper", "To Be Kind", "CodSimulator20XX"]; // Replace with actual map names
    /*let map = {};
    if (number < firstCorrectMaps.length) {
        const mapName = firstCorrectMaps[number];
        map = possibleMaps.find(map => map.Name == mapName);

        // fallback to the mod function
        if (!map) {
             map = possibleMaps[(482 * number + 182) % mapCutOff];
        }
    } else {
    // mod prime returns unique numbers for the entire cycle, which is nice (can break if maps get taken out of ffa and other circumstances, whatever)
        map = possibleMaps[(482 * number + 182) % mapCutOff];
    }

    return map;
}*/

function getMapOfTheDay(number) {
    /* spoilers to the right, do not look!!!!                                                                                                                                                                                                                                            */let firstCorrectMaps = ["Haunted Tower", "Egghunt 3", "Blight", "Jiga's Claymaze", "Chaoskampf", "E", "Trick or Treat", "Its Better Together", "Resource Parkour", "Bugs", "Minas Tirith", "Factory", "Uluru", "Super Minr Kart", "Mean Messages 2: Electric Boogaloo", "Wolly Mammoth", "Retro Runner Tapper", "To Be Kind", "CodSimulator20XX"]; // Replace with actual map names
    let map = {};
    let fallbackToRandomMap = true;

    if (number < firstCorrectMaps.length) {
        const mapName = firstCorrectMaps[number];
        map = possibleMaps.find(map => map.Name == mapName);

        // fallback to the mod function
        if (map) {
             fallbackToRandomMap = false;
        }
    }

    // shuffle all possible maps and take the map at index number
    if (fallbackToRandomMap) {
        let mapIndices = Array.from(Array(mapCutOff).keys())
        mapIndices = shuffle(mapIndices, mapSeed);
        let randomIndex = mapIndices[number%mapCutOff];
        map = possibleMaps[randomIndex];
    }

    // fallback JUST IN CASE
    if (!map) map = possibleMaps[0]

    return map;
}

// randomize map list with a seed to generate random map:
function random(seed) {
    return function() {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };
}

function shuffle(array, seed) {
    let rng = random(seed);
    let shuffled = array.slice(); // Copy array to avoid mutation

    for (let i = shuffled.length - 1; i > 0; i--) {
        let j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}


function updateGuesses() {
    let guessesBox = document.querySelector(".guesses_box");
    guessesBox.textContent = `Guess ${guessNumber} out of ${maxGuesses}`;
}

// listen to input in input box
inputElement.addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase(); // get the input value
    let isUsingEasyMode = easyModeAtStep > 0

    // clear suggestions if query is empty and easy mode is not on
    if (query == "" && !isUsingEasyMode) {
        suggestionsElement.innerHTML = '';
        return;
    }
    const filteredMaps = guessableMaps.filter(map =>
        map.Name.toLowerCase().startsWith(query) // match starting letters
    )

    topSuggestion = filteredMaps[0];

    updateSuggestions(filteredMaps);
});

// Clear suggestions when the input loses focus if easy mode is on
inputElement.addEventListener('blur', () => {
    let isUsingEasyMode = easyModeAtStep > 0;
    if (isUsingEasyMode) {
        // clear suggestions after a bit, otherwise clicking maps does not trigger 
        setTimeout(() => {
            suggestionsElement.innerHTML = '';
        }, 100);
    }
});

// show suggestions when input is in focus and easy mode is on
inputElement.addEventListener('focus', () => {
    let isUsingEasyMode = easyModeAtStep > 0;
    if (isUsingEasyMode) {
        updateSuggestions(guessableMaps);
    }
});

// function to update the suggestions
function updateSuggestions(maps) {
    // clear previous suggestions
    suggestionsElement.innerHTML = '';

    // add new suggestions
    maps.forEach(map => {
        const li = document.createElement('li');
        li.textContent = map.Name;
        // optionally, click suggestion to enter answer
        li.addEventListener('click', () => {
            inputElement.value = "" // empty input
            suggestionsElement.innerHTML = ''; // clear suggestions
            console.log(map);
            guessMap(map);
        });

        suggestionsElement.appendChild(li);
    });
}

document.querySelector('.input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const input = event.target.value.trim(); // get the entered map name
        let map = guessableMaps.find(m => m.Name.toLowerCase() === input.toLowerCase()); // case-insensitive match

        if (!map) {
            map = topSuggestion
        }

        if (!map) {
            return;
        }

        // clear input field
        event.target.value = '';
        // clear suggestions
        suggestionsElement.innerHTML = '';

        guessMap(map)
    }
});

// load state and return current guesses
function getGuesses() {
    const gameState = loadState(allMaps);
    let guesses = gameState.guesses;
    guessNumber = guesses.length + 1;
    easyModeAtStep = gameState.easyModeAtStep;
    if (easyModeAtStep > 0) updateGuessableMaps(guesses);
    return guesses;
}

function guessMap(map) {
    let guesses = getGuesses();

    // check if guesses contains map, have to compare strings because === does not work
    let containsMap = guesses.some(guess => JSON.stringify(guess) === JSON.stringify(map))
    if (map && !containsMap) {
        guessNumber++;
        
        guesses.push(map);

        if (easyModeAtStep > 0) {
            updateGuessableMaps(guesses);
            console.log(easyModeAtStep)
            // set easy mode button in place if it was enabled before first guess
            disableEasyModeButton();
        }

        saveState(guesses, easyModeAtStep);

        // update guess title
        updateGuesses();

        createGuess(map, true);

        checkCorrectOrOutOfGuesses(map, true);
    } else {
        // invalid map
    }
}

// create and add guess html elements
function createGuess(map, doAnimation) {
    // create a div for the guess
    const guessContainer = document.createElement('div');
    guessContainer.className = 'guess-container';
        

    // add a div for the map (title and optionally creator)
    const mapDiv = document.createElement('div');
    mapDiv.className = 'guess-container__map';
    // add a div for the title of the map
    const nameDiv = document.createElement('div');
    let difficultyClassName = getDifficultyClass(map.Difficulty);
    nameDiv.classList.add('guess-container__map__title', difficultyClassName);
    nameDiv.textContent = map.Name;
    mapDiv.appendChild(nameDiv);

    // add creators if correct

    if (isSameMap(map, correctMap)) {
        addCreatorsElement(mapDiv, map);
    }

    guessContainer.appendChild(mapDiv);

    // compare the guess with the correct map
    const attributes = compareMap(correctMap, map);
        
        
    // add divs for each field
    let fields = ['CreatorCount', 'Type', 'Date', 'Difficulty', 'PureOrMixed', 'Location']
    for(let i = 0; i < fields.length; i++) {
        let field = fields[i];
        const fieldDiv = document.createElement('div');
        fieldDiv.className = `field ${attributes[field].toLowerCase()}`; // Add class based on the result

        // animate color appearing
        if (doAnimation) {
            fieldDiv.style.animationDelay = `${i * 0.15}s`
        }
        addFieldText(field, map, fieldDiv);
        guessContainer.appendChild(fieldDiv);
    };
        
    // add after input_box
    document.querySelector(".input_box").after(guessContainer);
}

function isSameMap(mapOne, mapTwo) {
    return JSON.stringify(mapOne) === JSON.stringify(mapTwo);
}

function addCreatorsElement(mapDiv, map) {
    // add a div for the title of the map
    const nameDiv = document.createElement('div');
    let difficultyClassName = getDifficultyClass(map.Difficulty);
    nameDiv.classList.add('guess-container__map__creators', difficultyClassName);
    nameDiv.textContent = `by ${map.Creators}`;
    mapDiv.appendChild(nameDiv);
}

async function checkCorrectOrOutOfGuesses(guess, doDelay) {
    let correct = isSameMap(guess, correctMap);
    let outOfGuesses = guessNumber > maxGuesses;

    if (outOfGuesses || correct) {
        document.querySelector('.input').disabled = true; // disables input field
        disableEasyModeButton();

        // add correct map if they did not get it
        if (!correct) {
            // sleep for a bit so that it does not seem like they got it correct with their latest guess
            if (doDelay) await new Promise(r => setTimeout(r, 500));
            createGuess(correctMap, true);
        }

        // create button for sharing result

        if (doDelay) await new Promise(r => setTimeout(r, 1500));
        const shareButton = document.createElement('button');
        shareButton.textContent = "Share Results";
        shareButton.className = 'share-button'; 
        
        // copy result if clicked
        shareButton.addEventListener('click', () => {
            const resultsMessage = generateResultsMessage(correct, outOfGuesses);
            copyToClipboard(resultsMessage);
            shareButton.textContent = "Copied!";
        });
        

        document.querySelector(".input_box").after(shareButton);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch((err) => {
        console.error("Failed to copy text to clipboard", err);
    });
}

// function to generate the results message
function generateResultsMessage(correct) {
    let squares = ""; 

    let guesses = getGuesses();

    for(let i = 0; i < guesses.length; i++) {
        let guess = guesses[i];
        const attributes = compareMap(guess, correctMap);

        // calculate the score for this guess
        let guessScore = 0;
        for (let key in attributes) {
            if (attributes[key] === "Correct") {
                guessScore += 1;
            } else if (attributes[key] === "Close") {
                guessScore += 0.5;
            }
        }

        // displays tool to signify easy mode was enabled, does not show if user guessed first try anyways
        if (i + 1 == easyModeAtStep && i != 0) {
            squares += "🛠️";
        }

        if (guessScore >= scoreForYellowSquare) {
            if (isSameMap(guess, correctMap)) {
                squares += "✅";
            } else {
                squares += "🟨";
            }
        } else {
            squares += "🟥";
        }
    }
    const wrongEmoji = correct ? "" : "❌";
    return `Minrle #${gameNumber} 👑\n\n${squares}${wrongEmoji}`;
}

// Get class for styling map name based on difficulty
function getDifficultyClass(difficulty) {
    switch(difficulty) {
        case "Unassessed":
            return 'guess-container__title--unassessed'
        case "Very Easy":
            return 'guess-container__title--very-easy'
        case "Easy":
            return 'guess-container__title--easy'
        case "Novice":
            return 'guess-container__title--novice'
        case "Moderate":
            return 'guess-container__title--moderate'
        case "Hard":
            return 'guess-container__title--hard'
        case "Very Hard":
            return 'guess-container__title--very-hard'
        case "Expert":
            return 'guess-container__title--expert'
    }

}

// add text in guess square
function addFieldText(field, map, fieldDiv) {
    if (field == "PureOrMixed") {
        const fieldContent = document.createElement('h2');
        fieldContent.textContent = map[field];
        fieldDiv.appendChild(fieldContent);
    } else {
        createFieldElements(field, map, fieldDiv);
    }

}

// construct and add h2 and h3 elements for guess squares
function createFieldElements(field, map, fieldDiv) {
    const fieldTitle = document.createElement('h3');
    const fieldContent = document.createElement('h2');
    
    let fields = ['CreatorCount', 'Type', 'Date', 'Difficulty', 'PureOrMixed', 'Location'];
    let properFieldNames = ['Creators', 'Primary Type', 'Released', 'Difficulty', 'Pure', 'Location'];

    fieldTitle.textContent = properFieldNames[fields.indexOf(field)]

    if (field == "Date") {
        // denote whether date is before or after date guessed
        if (correctMap.DateAsString == map.DateAsString) {
            fieldContent.textContent = map.DateAsString;
        } else if (correctMap.Date < map.Date) {
            fieldContent.textContent = `< ${map.DateAsString}`;
        } else {
            fieldContent.textContent = `${map.DateAsString} >`;
        }
    } else {
        fieldContent.textContent = map[field]
    }
    fieldDiv.appendChild(fieldTitle);
    fieldDiv.appendChild(fieldContent);
}


// tooltip stuff which I made chatgpt write because I got lazy
document.addEventListener("DOMContentLoaded", () => {
    // Get all tooltip containers
    const tooltipContainers = document.querySelectorAll(".tooltip-container");
  
    // Add click event listeners to each tooltip container
    tooltipContainers.forEach((container) => {
      container.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevent the event from propagating to the document
        container.classList.toggle("show-tooltip");
      });
  
      // Add event listener to close button
      const closeButton = container.querySelector(".close-btn");
      if (closeButton) {
        closeButton.addEventListener("click", (event) => {
          event.stopPropagation(); // Prevent parent container toggle
          container.classList.remove("show-tooltip");
        });
      }
    });
  
    // Hide all tooltips when clicking anywhere outside
    document.addEventListener("click", () => {
      tooltipContainers.forEach((container) => {
        container.classList.remove("show-tooltip");
      });
    });
  });

  // easy mode code, where guessable maps are within range of date

  function updateGuessableMaps(guesses) {
    const correctDate = correctMap.Date.getTime();

    let beforeBoundary = new Date("2000-01-01T00:00:00Z").getTime();
    let afterBoundary = new Date("2500-01-01T00:00:00Z").getTime();

    guesses.forEach((map) => {
        let mapDate = map.Date.getTime();
        // get latest guess that is still before correctDate
        if (mapDate <= correctDate && beforeBoundary < mapDate) {
            beforeBoundary = mapDate;
        }

        // and get earliest guess that is still after correctDate
        if (mapDate >= correctDate && afterBoundary > mapDate) {
            afterBoundary = mapDate;
        }
    })

    const timeDifferenceForClose = 500 * msToDaysRatio;

    // bring boundaries closer if they are not within 500 days of the correct date, as those maps would be impossible to be correct
    if (correctDate + timeDifferenceForClose < afterBoundary) {
        afterBoundary -= timeDifferenceForClose;
    }

    if (correctDate - timeDifferenceForClose > beforeBoundary) {
        beforeBoundary += timeDifferenceForClose;
    }

    guessableMaps = allMaps.filter(map => {
        let mapDate = map.Date.getTime();
        // only allow maps that are after the first boundary if it is after, or if they're the correct date
        let afterBeforeBoundary = mapDate > beforeBoundary || mapDate === correctDate;
        let beforeAfterBoundary = mapDate < afterBoundary || mapDate === correctDate;

        if (afterBeforeBoundary && beforeAfterBoundary) {
            return map;
        }

    });

    //console.log("Updated guessableMaps:", guessableMaps);
  }

// copy result if clicked
easyModeButton.addEventListener('click', () => {
    let guesses = getGuesses();
    if (guessNumber == 1) {
        easyModeAtStep = 1 - easyModeAtStep;
    } else {
        easyModeAtStep = guessNumber;
    }
    saveState(guesses, easyModeAtStep);
    updateGuessableMaps(guesses);
    disableEasyModeButton();
});

function disableEasyModeButton() {
    if (easyModeAtStep > 1 || guessNumber > 1) {
        easyModeButton.disabled = true;
        easyModeButton.classList.remove("easy-mode-button--on");
    } else if (easyModeAtStep == 1) {
        easyModeButton.classList.add("easy-mode-button--on");
    } else {
        easyModeButton.classList.remove("easy-mode-button--on");
    }
}

