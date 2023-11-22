import gc from "@sg/game-client-base";
import { _decorator } from "cc";
import { ResultPercentage as BaseResultPercentage } from "db://shared-components/game/result-percentage/scripts/result-percentage";
const { ccclass } = _decorator;

@ccclass("ResultPercentage")
export class ResultPercentage extends BaseResultPercentage {
    calculateWin(originalChoices: string[], roundHistory: gc.RoundHistories.RoundHistory[]) {
        return roundHistory.reduce((count: Record<string, number>, history) => {
            originalChoices.forEach((choice) => {
                count[choice] = count[choice] ?? 0;
                const settlementResult = history?.settlementResult?.[choice];

                if (typeof settlementResult === "number" && settlementResult === 1) {
                    count[choice]++;
                }
            });
            return count;
        }, {});
    }
}
