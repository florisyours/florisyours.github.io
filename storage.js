const STORAGE_KEY = "userGuesses";
const CURRENT_GAME_KEY = "guessesExpiration";
const today = new Date();
const todaysGameDate = today.toLocaleDateString("en-US", {timeZone: "America/New_York"});

// Save guesses to localStorage with expiration
export function saveGuesses(guesses) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guesses));
    localStorage.setItem(CURRENT_GAME_KEY, todaysGameDate);
}

// Load guesses from localStorage if on same game
export function loadGuesses() {
    const currentGame = localStorage.getItem(CURRENT_GAME_KEY);
    if (currentGame && currentGame === todaysGameDate) {
        let guesses = localStorage.getItem(STORAGE_KEY);
        guesses = JSON.parse(guesses)

        // convert date back to Date
        guesses.forEach((guess) => guess.Date = new Date(guess.DateAsString))

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