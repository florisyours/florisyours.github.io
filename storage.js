const STORAGE_KEY = "userGuesses";
const CURRENT_GAME_KEY = "gameNumber";
const msToDaysRatio = 1000 * 60 * 60 * 24;

const firstDay = new Date("2024-12-21T00:00:00Z");
const now = new Date();

let gameNumber = Math.ceil((now - firstDay) / msToDaysRatio);

// Save guesses to localStorage with expiration
export function saveGuesses(guesses) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guesses));
    localStorage.setItem(CURRENT_GAME_KEY, gameNumber);
}

// Load guesses from localStorage if on same game
export function loadGuesses(maps) {
    const currentGame = localStorage.getItem(CURRENT_GAME_KEY);
    if (currentGame && currentGame == gameNumber) {
        let guesses = localStorage.getItem(STORAGE_KEY);
        guesses = JSON.parse(guesses)

        // convert date back to Date
        //guesses.forEach((guess) => guess.Date = new Date(guess.DateAsString))

        // update guesses in case information got outdated
        guesses = guesses.map(guess => {
            const matchingMap = maps.find(map => map.Name === guess.Name);
            return matchingMap;
        });

        return guesses;
    } else {
        clearGuesses(); // Clear expired data
        return [];
    }
}

// Clear guesses from localStorage
function clearGuesses() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_GAME_KEY);
}
