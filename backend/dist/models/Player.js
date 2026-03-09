"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newPlayer = newPlayer;
function newPlayer(id, displayName) {
    return {
        id,
        displayName,
        score: 0,
        connected: true,
        achievements: [],
        missionCompleted: false,
        roundWins: 0,
        totalReactionsReceived: 0,
        answersSubmitted: 0,
        consecutiveWins: 0,
    };
}
