const middleCards = [...document.querySelector("#middle-cards").children];
const playerCards = [...document.querySelector("#player-cards").children];
middleCards.forEach((card) => card.addEventListener("click", cardClick));
playerCards.forEach((card) => card.addEventListener("click", cardClick));

function cardClick(e) {
    if (!e.target.classList.contains("card")) {
        return;
    }

    if (!e.target.classList.contains("unknown")) {
        e.target.classList.add("unknown");
        e.target.removeAttribute("data-value");
        e.target.removeAttribute("data-suit");
        cardsUpdated();
        return;
    }

    openCardSelector(e.target);
}

const cardSelectorElement = document.querySelector("#card-selector");
const contentWrapper = document.querySelector("#content-wrapper");
const cardSelectorValues = [...document.querySelector("#card-values").children];
const cardSelectorSuits = [...document.querySelector("#card-suits").children];
const submitCardButton = document.querySelector("#submit-card-selector");
const cancelCardButton = document.querySelector("#cancel-card-selector");
let selectedValue = null;
let selectedSuit = null;
let selectedCard = null;

cardSelectorValues.forEach((value) => {
    value.addEventListener("click", (e) => {
        if (e.target.classList.contains("disabled")) return;
        if (selectedValue === e.target.dataset.value) {
            selectedValue = null;
            e.target.classList.remove("selected");
            selectionUpdated();
            return;
        }
        selectedValue = e.target.dataset.value;
        selectionUpdated();
        cardSelectorValues.forEach((value) =>
            value.classList.remove("selected")
        );
        e.target.classList.add("selected");
    });
});
cardSelectorSuits.forEach((suit) => {
    suit.addEventListener("click", (e) => {
        if (e.target.classList.contains("disabled")) return;
        if (selectedSuit === e.target.dataset.suit) {
            selectedSuit = null;
            e.target.classList.remove("selected");
            selectionUpdated();
            return;
        }
        selectedSuit = e.target.dataset.suit;
        selectionUpdated();
        cardSelectorSuits.forEach((suit) => suit.classList.remove("selected"));
        e.target.classList.add("selected");
    });
});
submitCardButton.addEventListener("click", () => closeCardSelector(false));
cancelCardButton.addEventListener("click", () => closeCardSelector(true));

function openCardSelector(card) {
    cardSelectorElement.classList.add("open");
    contentWrapper.classList.add("grayed-out");
    selectedCard = card;
    selectedValue = null;
    selectedSuit = null;

    cardSelectorValues.forEach((value) => value.classList.remove("selected"));
    cardSelectorSuits.forEach((suit) => suit.classList.remove("selected"));
}

function closeCardSelector(canceled) {
    cardSelectorElement.classList.remove("open");
    contentWrapper.classList.remove("grayed-out");
    cardSelectorValues.forEach((value) => value.classList.remove("disabled"));
    cardSelectorSuits.forEach((suit) => suit.classList.remove("disabled"));

    if (!selectedCard) return;
    if (canceled) return;

    if (selectedValue && selectedSuit) {
        selectedCard.classList.remove("unknown");
        selectedCard.dataset.value = selectedValue;
        selectedCard.dataset.suit = selectedSuit;
        cardsUpdated();
    }
}

function selectionUpdated() {
    cardSelectorValues.forEach((value) => value.classList.remove("disabled"));
    cardSelectorSuits.forEach((suit) => suit.classList.remove("disabled"));

    if (selectedValue && selectedSuit) {
        submitCardButton.disabled = false;
    } else {
        submitCardButton.disabled = true;
    }

    const { playerCards, middleCards } = getCardsAsStrings();
    const allCards = playerCards.concat(middleCards);

    if (selectedSuit) {
        cardSelectorValues.forEach((value) => {
            if (
                allCards.some(
                    (card) =>
                        card[0] === value.dataset.value &&
                        card[1] === selectedSuit
                )
            ) {
                value.classList.add("disabled");
            }
        });
    }

    if (selectedValue) {
        cardSelectorSuits.forEach((suit) => {
            if (
                allCards.some(
                    (card) =>
                        card[0] === selectedValue &&
                        card[1] === suit.dataset.suit
                )
            ) {
                suit.classList.add("disabled");
            }
        });
    }
}

function cardsUpdated() {
    if (playerCards.some((card) => card.classList.contains("unknown"))) {
        calculateButton.disabled = true;
    } else {
        calculateButton.disabled = false;
    }
}

const numOfOpponentsInput = document.querySelector("#opponent-number");
document
    .querySelector("#opponent-number-minus")
    .addEventListener("click", () => {
        if (numOfOpponentsInput.value > 1) {
            numOfOpponentsInput.value--;
        }
    });

document
    .querySelector("#opponent-number-plus")
    .addEventListener("click", () => {
        if (numOfOpponentsInput.value < 9) {
            numOfOpponentsInput.value++;
        }
    });

numOfOpponentsInput.addEventListener("input", () => {
    if (numOfOpponentsInput.value < 1) {
        numOfOpponentsInput.value = 1;
    } else if (numOfOpponentsInput.value > 9) {
        numOfOpponentsInput.value = numOfOpponentsInput.value % 10 || 1;
    }
});

const calculateButton = document.querySelector("#calculate-odds");
const winPercentageElement = document.querySelector("#win-percentage");
const tiePercentageElement = document.querySelector("#tie-percentage");
calculateButton.addEventListener("click", calculateOdds);

function getCardsAsStrings() {
    return {
        playerCards: playerCards
            .filter((card) => card.dataset.value && card.dataset.suit)
            .map((card) => card.dataset.value + card.dataset.suit),
        middleCards: middleCards
            .filter((card) => card.dataset.value && card.dataset.suit)
            .map((card) => card.dataset.value + card.dataset.suit),
    };
}

const game = new Game();
async function calculateOdds() {
    const { playerCards, middleCards } = getCardsAsStrings();

    if (playerCards.length !== 2) {
        return;
    }

    let startTime = Date.now();
    let results;
    calculateButton.disabled = true;
    while (Date.now() - startTime < 1000) {
        results = game.simulateMultipleGames(
            playerCards,
            middleCards,
            parseInt(numOfOpponentsInput.value),
            1000,
            results
        );
        setPercentages(results, parseInt(numOfOpponentsInput.value));
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
    calculateButton.disabled = false;
}

function setPercentages(results, numberOfOpponents) {
    const total = results.Player + results.Tie + results.Opponent;
    const winPercent = results.Player / total;
    const tiePercent = results.Tie / total;

    winPercentageElement.textContent = `Win Percentage: ${(
        winPercent * 100
    ).toFixed(2)}%`;

    if (winPercent > 1 / (numberOfOpponents + 1)) {
        winPercentageElement.style.color = "green";
    } else if (
        winPercent + tiePercent / (numberOfOpponents + 1) >
        1 / (numberOfOpponents + 1)
    ) {
        winPercentageElement.style.color = "orange";
    } else {
        winPercentageElement.style.color = "red";
    }

    tiePercentageElement.textContent = `Tie Percentage: ${(
        (results.Tie / total) *
        100
    ).toFixed(2)}%`;
}

document.querySelector("#reset").addEventListener("click", () => {
    middleCards.forEach((card) => {
        card.classList.add("unknown");
        card.removeAttribute("data-value");
        card.removeAttribute("data-suit");
    });

    playerCards.forEach((card) => {
        card.classList.add("unknown");
        card.removeAttribute("data-value");
        card.removeAttribute("data-suit");
    });

    winPercentageElement.textContent = "Win Percentage: 0%";
    tiePercentageElement.textContent = "Tie Percentage: 0%";
});
