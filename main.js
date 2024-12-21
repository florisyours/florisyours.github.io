import { fetchPossibleMaps, compareMap } from './maps.js';
import { saveGuesses, loadGuesses } from './storage.js'
var allMaps = [];
var possibleMaps = [];
var correctMap = {}

// Get references to the input element and suggestions container
const inputElement = document.querySelector('.input');
const suggestionsElement = document.querySelector('.suggestions');

// top map of suggestions for if they press enter
let topSuggestion;
let guessNumber = 1;
const maxGuesses = 10;
const scoreForYellowSquare = 3;
const msToDaysRatio = 1000 * 60 * 60 * 24;
const mapCutOff = 701;

// start date in EST
const firstDay = new Date("2024-12-21T00:00:00-05:00"); // Specify EST using offset (-05:00)

// current date adjusted to EST
const now = new Date();
const easternToday = new Date(
  now.toLocaleString("en-US", { timeZone: "America/New_York" })
);

const gameNumber = Math.ceil((easternToday - firstDay) / msToDaysRatio);

fetchPossibleMaps().then((maps) => {
  //console.log('Possible Maps:', maps.possibleMaps);
  allMaps = maps.allMaps;
  possibleMaps = maps.possibleMaps;
  
  // mod prime returns unique numbers for the entire cycle, which is nice (can break if maps get taken out of ffa and other circumstances, whatever)
  correctMap = possibleMaps[(445 * gameNumber) % mapCutOff];

  // load guesses
  const guesses = loadGuesses();
  guessNumber = guesses.length + 1
  if (guessNumber > 1) {
      console.log("Loaded guesses:", guesses);

      guesses.forEach((guess) => createGuess(guess))
       //update guesses text
      updateGuesses();
      checkCorrectOrOutOfGuesses(guesses[guesses.length - 1])

  }

});


function updateGuesses() {
    let guessesBox = document.querySelector(".guesses_box")
    guessesBox.textContent = `Guess ${guessNumber} out of ${maxGuesses}`
}

// listen to input in input box
inputElement.addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase(); // get the input value

    // clear suggestions if query is empty
    if (query == "") {
        suggestionsElement.innerHTML = '';
        return
    }
    const filteredMaps = allMaps.filter(map =>
        map.Name.toLowerCase().startsWith(query) // match starting letters
    );

    topSuggestion = filteredMaps[0];

    updateSuggestions(filteredMaps);
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
            guessMap(map);
        });

        suggestionsElement.appendChild(li);
    });
}

document.querySelector('.input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const input = event.target.value.trim(); // get the entered map name
        let map = allMaps.find(m => m.Name.toLowerCase() === input.toLowerCase()); // case-insensitive match

        if (!map) {
            map = topSuggestion
        }

        // clear input field
        event.target.value = '';
        // clear suggestions
        suggestionsElement.innerHTML = '';

        guessMap(map)
    }
});

function guessMap(map) {
    let guesses = loadGuesses();
    console.log(guesses)

    // check if guesses contains map, have to compare strings because === does not work
    let containsMap = guesses.some(guess => JSON.stringify(guess) === JSON.stringify(map))
    if (map && !containsMap) {
        guessNumber++;

        const currentGuesses = loadGuesses();
        currentGuesses.push(map);
        saveGuesses(currentGuesses);

        // update guess title
        updateGuesses()

        createGuess(map)

        checkCorrectOrOutOfGuesses(map)
    } else {
        // invalid map
    }
}

// create and add guess html elements
function createGuess(map) {
    // create a div for the guess
    const guessContainer = document.createElement('div');
    guessContainer.className = 'guess-container';
        

    // add a div for the map (title and optionally creator)
    const mapDiv = document.createElement('div');
    mapDiv.className = 'guess-container__map'
    // add a div for the title of the map
    const nameDiv = document.createElement('div');
    let difficultyClassName = getDifficultyClass(map.Difficulty)
    nameDiv.classList.add('guess-container__map__title', difficultyClassName);
    nameDiv.textContent = map.Name;
    mapDiv.appendChild(nameDiv);

    // add creators if correct

    if (isSameMap(map, correctMap)) {
        addCreatorsElement(mapDiv, map);
    }

    guessContainer.appendChild(mapDiv)

    // compare the guess with the correct map
    const attributes = compareMap(correctMap, map);
        
        
    // add divs for each field
    ['CreatorCount', 'Type', 'Date', 'Difficulty', 'PureOrMixed', 'Location'].forEach((field) => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = `field ${attributes[field].toLowerCase()}`; // Add class based on the result
        addFieldText(field, map, fieldDiv);
        guessContainer.appendChild(fieldDiv);
    });
        
    // add after input_box
    document.querySelector(".input_box").after(guessContainer);
}

function isSameMap(mapOne, mapTwo) {
    return JSON.stringify(mapOne) === JSON.stringify(mapTwo)
}

function addCreatorsElement(mapDiv, map) {
    // add a div for the title of the map
    const nameDiv = document.createElement('div');
    let difficultyClassName = getDifficultyClass(map.Difficulty)
    nameDiv.classList.add('guess-container__map__creators', difficultyClassName);
    nameDiv.textContent = `by ${map.Creators}`;
    mapDiv.appendChild(nameDiv);
}

async function checkCorrectOrOutOfGuesses(guess) {
    let correct = isSameMap(guess, correctMap);
    let outOfGuesses = guessNumber > maxGuesses;

    if (outOfGuesses || correct) {
        document.querySelector('.input').disabled = true; // disables input field

        // add correct map if they did not get it
        if (!correct) {
            // sleep for a bit so that it does not seem like they got it correct with their latest guess
            await new Promise(r => setTimeout(r, 500));
            createGuess(correctMap);
        }

        // create button for sharing result
        const shareButton = document.createElement('button');
        shareButton.textContent = "Share Results";
        shareButton.className = 'share-button'; 
        
        // copy result if clicked
        shareButton.addEventListener('click', () => {
            const resultsMessage = generateResultsMessage(correct, outOfGuesses);
            copyToClipboard(resultsMessage);
            shareButton.textContent = "Copied!"
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
    let guesses = loadGuesses();
    guesses.forEach((guess) => {
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


        if (guessScore >= scoreForYellowSquare) {
            if (isSameMap(guess, correctMap)) {
                squares += "✅";
            } else {
                squares += "🟨";
            }
        } else {
            squares += "🟥";
        }
        console.log(guessScore);
    });
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
    
    let fields = ['CreatorCount', 'Type', 'Date', 'Difficulty', 'PureOrMixed', 'Location']
    let properFieldNames = ['Creators', 'Primary Type', 'Released', 'Difficulty', 'Pure', 'Location']

    fieldTitle.textContent = properFieldNames[fields.indexOf(field)]

    if (field == "CreatorCount") {
        let numbers = ["Solo", "Duo", "Three", "Four", "Five", "Six", "Seven", "Eight"]
        fieldContent.textContent = numbers[map[field] - 1]
    } else if (field == "Date") {
        // denote whether date is before or after date guessed
        if (correctMap.Date < map.Date) {
            fieldContent.textContent = `< ${map.DateAsString}`
        } else if (correctMap.Date > map.Date) {
            fieldContent.textContent = `${map.DateAsString} >`
        } else {
            fieldContent.textContent = map.DateAsString;
        }
    } else {
        fieldContent.textContent = map[field]
    }
    fieldDiv.appendChild(fieldTitle);
    fieldDiv.appendChild(fieldContent);
}