import { _decorator } from "cc";
import { ResultPercentage as BaseResultPercentage } from "db://shared-components/game/result-percentage/scripts/result-percentage";
const { ccclass } = _decorator;

@ccclass("ResultPercentage")
export class ResultPercentage extends BaseResultPercentage {
    calculateWin(originalChoices: string[], roundHistory: any) {
        return roundHistory.reduce((count: any, history) => {
            originalChoices.forEach((choice) => {
                count[choice] = count[choice] ?? 0;
                if (history?.settlementResult?.[choice] === 1) {
                    count[choice] = count[choice] + 1;
                }
            });
            return count;
        }, {});
    }
}
