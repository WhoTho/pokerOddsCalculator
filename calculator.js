class Game {
    constructor(numOfOpponents = 1) {
        this.reset();

        this.numOfOpponents = numOfOpponents;
    }

    reset() {
        this.myHand = [];
        this.middleCards = [];
        this.availableCards = "A23456789TJQK"
            .split("")
            .map((cardValue) =>
                "CDHS".split("").map((suit) => cardValue + suit)
            )
            .flat();
    }

    setMyHand(hand) {
        this.myHand = hand.slice();
        this._removeCards(hand);
    }

    setMiddleCards(middleCards) {
        this.middleCards = middleCards.slice();
        this._removeCards(middleCards);
    }

    dealRandomCard() {
        return this.availableCards.splice(
            Math.floor(Math.random() * this.availableCards.length),
            1
        )[0];
    }

    _removeCards(cards) {
        this.availableCards = this.availableCards.filter(
            (card) => !cards.includes(card)
        );
    }

    _removeCard(card) {
        this._removeCards([card]);
    }

    simulate() {
        let opponentHands = [];

        for (let i = 0; i < this.numOfOpponents; i++) {
            opponentHands.push([this.dealRandomCard(), this.dealRandomCard()]);
        }

        for (let i = this.middleCards.length; i < 5; i++) {
            this.middleCards.push(this.dealRandomCard());
        }

        let winner = this.determineWinner(
            this.myHand,
            opponentHands,
            this.middleCards
        );

        // if (winner.winner === "Tie" && HI === 1) {
        //     HI = 0;

        //     console.log(this.availableCards.length);
        //     console.log("Player hand:", this.myHand);
        //     console.log("Opponent hand:", opponentHand);
        //     console.log("Middle cards:", this.middleCards);
        //     console.log("Winner:", winner.winner);
        //     console.log("My rankings:");
        //     for (let ranking of winner.myRankings) {
        //         console.log(
        //             HandRankings.rankingToString(ranking[0]),
        //             "with deciding value",
        //             ranking[1]
        //         );
        //     }

        //     console.log("\nOpponent rankings:");
        //     for (let ranking of winner.opponentRankings) {
        //         console.log(
        //             HandRankings.rankingToString(ranking[0]),
        //             "with deciding value",
        //             ranking[1]
        //         );
        //     }
        // }

        return winner;
    }

    simulateMultipleGames(myHand, middle, n) {
        let wins = { Player: 0, Opponent: 0, Tie: 0 };
        for (let i = 0; i < n; i++) {
            this.reset();
            this.setMyHand(myHand);
            this.setMiddleCards(middle);

            let winner = this.simulate();
            wins[winner.winner]++;
        }
        return wins;
    }

    cardValue(card) {
        return (
            {
                A: 14,
                K: 13,
                Q: 12,
                J: 11,
                T: 10,
            }[card[0]] || parseInt(card[0])
        );
    }

    determineWinner(myHand, opponentHands, middleCards) {
        let myRankings = HandRankings.calculateRankings(
            this,
            myHand.concat(middleCards)
        );

        let opponentRankings = opponentHands.map((opponentHand) =>
            HandRankings.calculateRankings(
                this,
                opponentHand.concat(middleCards)
            )
        );

        let winner = "Tie";
        for (let i = 0; i < myRankings.length; i++) {
            let myRanking = myRankings[i];
            let maxOpponentRanking = 0;
            let maxOpponentDecidingValue = 0;

            for (let opponentRanking of opponentRankings) {
                if (opponentRanking.length <= i) continue;

                if (opponentRanking[i][0] > maxOpponentRanking) {
                    maxOpponentRanking = opponentRanking[i][0];
                    maxOpponentDecidingValue = opponentRanking[i][1];
                }
            }

            if (myRanking[0] > maxOpponentRanking) {
                winner = "Player";
                break;
            } else if (myRanking[0] < maxOpponentRanking) {
                winner = "Opponent";
                break;
            } else if (myRanking[1] > maxOpponentDecidingValue) {
                winner = "Player";
                break;
            } else if (myRanking[1] < maxOpponentDecidingValue) {
                winner = "Opponent";
                break;
            }
        }

        // let opponentRankings = HandRankings.calculateRankings(
        //     this,
        //     opponentHand.concat(middleCards)
        // );

        // let winner = "Tie";
        // for (let i = 0; i < myRankings.length; i++) {
        //     if (myRankings[i][0] > opponentRankings[i][0]) {
        //         winner = "Player";
        //         break;
        //     } else if (myRankings[i][0] < opponentRankings[i][0]) {
        //         winner = "Opponent";
        //         break;
        //     } else if (myRankings[i][1] > opponentRankings[i][1]) {
        //         winner = "Player";
        //         break;
        //     } else if (myRankings[i][1] < opponentRankings[i][1]) {
        //         winner = "Opponent";
        //         break;
        //     }
        // }

        return {
            winner,
            myRankings,
            opponentRankings,
        };
    }
}

// HI = 1;

class HandRankings {
    static ROYAL_FLUSH = 10;
    static STRAIGHT_FLUSH = 9;
    static FOUR_OF_A_KIND = 8;
    static FULL_HOUSE = 7;
    static FLUSH = 6;
    static STRAIGHT = 5;
    static THREE_OF_A_KIND = 4;
    static TWO_PAIR = 3;
    static PAIR = 2;
    static HIGH_CARD = 1;

    static calculateRankings(game, allCards) {
        let suits = allCards.map((card) => card[1]);
        let values = allCards.map((card) => game.cardValue(card[0]));

        let flush = HandRankings._getFlushData(suits, values);
        let straight = HandRankings._getStraightData(values);

        let rankings = []; // [[hand ranking, deciding value (like pair value or highest straight)], ...]

        if (flush && straight) {
            rankings.push([HandRankings.ROYAL_FLUSH, flush.bestCardValue]);
        } else if (flush) {
            rankings.push([HandRankings.FLUSH, flush.bestCardValue]);
        } else if (straight) {
            rankings.push([HandRankings.STRAIGHT, straight.bestCardValue]);
        }

        let amountsToValues = HandRankings._tallyValues(values);

        if (amountsToValues[4].length) {
            rankings.push([HandRankings.FOUR_OF_A_KIND, amountsToValues[4][0]]);
        }

        if (amountsToValues[3].length && amountsToValues[2].length) {
            rankings.push([HandRankings.FULL_HOUSE, amountsToValues[3][0]]);
        }

        if (amountsToValues[3].length) {
            rankings.push([
                HandRankings.THREE_OF_A_KIND,
                amountsToValues[3][0],
            ]);
        }

        if (amountsToValues[2].length >= 2) {
            rankings.push([
                HandRankings.TWO_PAIR,
                Math.max(...amountsToValues[2]),
            ]);
            rankings.push([HandRankings.PAIR, Math.min(...amountsToValues[2])]);
        } else if (amountsToValues[2].length) {
            rankings.push([HandRankings.PAIR, amountsToValues[2][0]]);
        }

        rankings.push([HandRankings.HIGH_CARD, Math.max(...values)]);

        return rankings;
    }

    static _getFlushData(suits, values) {
        if (suits.length < 5) {
            return false;
        }

        const suitCounts = {};
        const suitMaxValues = {};

        for (let i = 0; i < suits.length; i++) {
            const suit = suits[i];
            const value = values[i];

            suitCounts[suit] = (suitCounts[suit] || 0) + 1;
            suitMaxValues[suit] = Math.max(suitMaxValues[suit] || 0, value);
        }

        const bestSuit = Object.keys(suitCounts).find(
            (suit) => suitCounts[suit] >= 5
        );

        if (!bestSuit) {
            return false;
        }

        return {
            suit: bestSuit,
            bestCardValue: suitMaxValues[bestSuit],
        };
    }

    static _getStraightData(values) {
        if (values.length < 5) {
            return false;
        }

        let sortedValues = [...new Set(values)].sort((a, b) => a - b);
        if (sortedValues.at(-1) === 14) {
            sortedValues.unshift(1);
        }

        for (let i = 0; i <= sortedValues.length - 5; i++) {
            let isStraight = true;
            for (let j = 0; j < 4; j++) {
                if (sortedValues[i + j] + 1 !== sortedValues[i + j + 1]) {
                    isStraight = false;
                    break;
                }
            }
            if (isStraight) {
                return { bestCardValue: sortedValues[i + 4] };
            }
        }

        return false;
    }

    static _tallyValues(values) {
        const amountsToValues = { 1: [], 2: [], 3: [], 4: [] };

        const valueCounts = {};
        for (let value of values) {
            valueCounts[value] = (valueCounts[value] || 0) + 1;
        }

        for (let value in valueCounts) {
            amountsToValues[valueCounts[value]].push(parseInt(value));
        }

        return amountsToValues;
    }

    static rankingToString(ranking) {
        return [
            "High Card",
            "Pair",
            "Two Pair",
            "Three of a Kind",
            "Straight",
            "Flush",
            "Full House",
            "Four of a Kind",
            "Straight Flush",
            "Royal Flush",
        ][ranking - 1];
    }
}

/*
Player hand: [ '2S', '2H' ]
Opponent hand: [ '8C', '3D' ]
Middle cards: [ 'QD', 'JD', '5H', '2D', '3C' ]
*/
// g = new Game();
// g.setMyHand(["2S", "2H"]);
// g.setMiddleCards(["QD", "JD", "5H", "4D", "3C"]);
// winner = g.simulate();
// console.log("Winner:", winner.winner);
// for (let ranking of winner.myRankings) {
//     console.log(
//         HandRankings.rankingToString(ranking[0]),
//         "with deciding value",
//         ranking[1]
//     );
// }

// console.log("\nOpponent rankings:");
// for (let ranking of winner.opponentRankings) {
//     console.log(
//         HandRankings.rankingToString(ranking[0]),
//         "with deciding value",
//         ranking[1]
//     );
// }

// g = new Game();
// winner = g.simulate();
// console.log("Winner:", winner.winner);
// console.log("My rankings:");
// for (let ranking of winner.myRankings) {
//     console.log(
//         HandRankings.rankingToString(ranking[0]),
//         "with deciding value",
//         ranking[1]
//     );
// }

// console.log("\nOpponent rankings:");
// for (let ranking of winner.opponentRankings) {
//     console.log(
//         HandRankings.rankingToString(ranking[0]),
//         "with deciding value",
//         ranking[1]
//     );
// }

n = 50_000;
g = new Game(1);
startTime = Date.now();
results = g.simulateMultipleGames(["AH", "AS"], [], n);
// console.log(results);
console.log(`Time taken for ${n} simulations: ${Date.now() - startTime}ms`);
console.log(`Player win rate: ${100 * (results.Player / n)}%`);
console.log(`Opponent win rate: ${100 * (results.Opponent / n)}%`);
console.log(`Tie rate: ${100 * (results.Tie / n)}%`);
