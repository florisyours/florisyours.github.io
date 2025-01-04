const STORAGE_KEY = "userGuesses";
const CURRENT_GAME_KEY = "gameNumber";
const EASY_MODE_KEY = "easyStep"
const msToDaysRatio = 1000 * 60 * 60 * 24;

const firstDay = new Date("2024-12-21T00:00:00Z");
const now = new Date();

let gameNumber = Math.ceil((now - firstDay) / msToDaysRatio);

// Save guesses to localStorage with expiration
export function saveState(guesses, easyModeAtStep) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guesses));
    localStorage.setItem(CURRENT_GAME_KEY, gameNumber);
    localStorage.setItem(EASY_MODE_KEY, easyModeAtStep)
    
}

// Load guesses from localStorage if on same game
export function loadState(maps) {
    const currentGame = localStorage.getItem(CURRENT_GAME_KEY);
    if (currentGame && currentGame == gameNumber) {
        let guesses = localStorage.getItem(STORAGE_KEY);
        guesses = JSON.parse(guesses)
        let easyModeAtStep = localStorage.getItem(EASY_MODE_KEY);

        // set easyModeAtStep to 0 if it does not exist
        if (!easyModeAtStep) {
            console.log(easyModeAtStep)
            easyModeAtStep = 0;
        }

        // convert date back to Date
        //guesses.forEach((guess) => guess.Date = new Date(guess.DateAsString))

        // update guesses in case information got outdated
        guesses = guesses.map(guess => {
            const matchingMap = maps.find(map => map.Name === guess.Name);
            return matchingMap;
        });

        return {guesses: guesses, easyModeAtStep: easyModeAtStep};
    } else {
        clearState(); // Clear expired data
        return {guesses: [], easyModeAtStep: 0};
    }
}

// Clear guesses from localStorage
function clearState() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_GAME_KEY);
}
