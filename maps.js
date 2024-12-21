const dayDifferenceForClose = 500;
const difficultyDifferenceForClose = 1;

const sheetId = "12adnu29aV7pS7K62oacxKRFdaRifxzzw8-x1A-514MI";
const sheetName = encodeURIComponent("Sheet1");
const sheetURL = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

export const fetchPossibleMaps = async () => {
    const response = await fetch(sheetURL);
    const csvText = await response.text();
    const sheetObjects = csvToObjects(csvText);
    sheetObjects.sort((a, b) => (a.Name > b.Name) ? 1 : -1);
    return {allMaps: sheetObjects, possibleMaps: getUniqueMaps(sheetObjects)};
  };

function getUniqueMaps(maps) {
    let uniqueMaps = []

    for (let i = 0; i < maps.length; i++) {
        let unique = true;
        for (let j = 0; j < maps.length; j++) {
            if (i === j) continue; // Skip comparing an object with itself

            const comparison = compareMap(maps[i], maps[j]);

            // Check if all fields are "Correct"
            const allCorrect = Object.values(comparison).every(value => value === "Correct");

            if (allCorrect) {
                unique = false;
            }
        }
        if (unique) {
            uniqueMaps.push(maps[i])
        }
    }

    return uniqueMaps;
}

function csvToObjects(csv) {
  const csvRows = csv.split("\n");
  let objects = [];
  for (let i = 1, max = csvRows.length; i < max; i++) {
    let row = csvSplit(csvRows[i]);

    // check if map has been removed, do not include in this case
    if (!(row[7] == "Removed" && row[7] == "Broken")) {
        addRow(row, objects)
    }

  }
  return objects;
}



function addRow(row, objects) {

    let thisObject = {};
    //thisObject[propertyNames];
    thisObject["Name"] = row[0];
    thisObject["Creators"] = row[1];
    thisObject["CreatorCount"] = countOccurences(row[1], ",") + 1;
    thisObject["Type"] = row[2];
    if (row[3].includes("-")) {
        thisObject["PureOrMixed"] = "Pure"
    } else {
        thisObject["PureOrMixed"] = "Mixed"
    }
    // HC maps include FFA+ in the name if they are FFA+
    if (row[7].includes("FFA+")) {
        thisObject["Location"] = "FFA+";
      } else {
        thisObject["Location"] = "FFA";
    }
    thisObject["Difficulty"] = row[8];
    row[9] = row[9].replace(/\s+/g, ' ');
    thisObject["Date"] = new Date(row[9]);
    thisObject["DateAsString"] = row[9];
    
    objects.push(thisObject);
}

function countOccurences(str, find) {
    return [...str.matchAll(find)].length;
}

function csvSplit(row) {
    const regex = /"(?:[^"]|"")*"|[^,]+/g;
    return Array.from(row.matchAll(regex), match => {
      let value = match[0];
      // Remove surrounding quotes and unescape double quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/""/g, '"');
      }
      return value;
    });
}

export function compareMap(guess, correctMap) {
    let attributes = {};

    // creator count ranges from 1 to 8. Vast majority are 1-3, so i'm opting to not have a close option for this
    if (guess.CreatorCount == correctMap.CreatorCount) {
        attributes.CreatorCount = "Correct";
    } else {
        attributes.CreatorCount = "Wrong";
    }

    if (guess.Type == correctMap.Type) {
        attributes.Type = "Correct";
    } else {
        attributes.Type = "Wrong";
    }

    if (guess.PureOrMixed == correctMap.PureOrMixed) {
        attributes.PureOrMixed = "Correct";
    } else {
        attributes.PureOrMixed = "Wrong";
    }

    if (guess.Location == correctMap.Location) {
        attributes.Location = "Correct"
    } else {
        attributes.Location = "Wrong"
    }

    attributes.Difficulty = compareDifficulty(guess, correctMap)

    const msToDaysRatio = 1000 * 60 * 60 * 24
    let dayDifference = Math.abs((correctMap.Date - guess.Date) / msToDaysRatio);
    if (dayDifference == 0) {
        attributes.Date = "Correct"
    } else if (dayDifference <= dayDifferenceForClose) {
        attributes.Date = "Close"
    } else {
        attributes.Date = "Wrong"
    }

    return attributes
}

function compareDifficulty(guess, correctMap) {
    const difficultyOrder = ["Unassessed", "Very Easy", "Easy", "Novice", "Moderate", "Hard", "Very Hard", "Expert"]
    let guessIndex = difficultyOrder.indexOf(guess.Difficulty);
    let correctIndex = difficultyOrder.indexOf(correctMap.Difficulty);

    // correct if spot on, close if within 1
    if (guessIndex == correctIndex) {
        return "Correct";
    } else if (Math.abs(guessIndex - correctIndex) <= difficultyDifferenceForClose) {
        return "Close";
    } else {
        return "Wrong";
    }
}

function getUniqueFieldValues(data, field) {
    const uniqueValues = new Set();
  
    data.forEach(item => {
      if (field in item) {
        uniqueValues.add(item[field]);
      }
    });
  
    console.log(Array.from(uniqueValues));
  }