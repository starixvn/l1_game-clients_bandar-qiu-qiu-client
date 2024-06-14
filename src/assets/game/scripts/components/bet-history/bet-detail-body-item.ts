import gc from "@sg/game-client-base";
import { _decorator } from "cc";
import BetDetailLogItem, {
    GameRoundBetDetailsLog,
} from "db://shared-components/game/bet-history/scripts/components/bet-detail/bet-detail-log-item";
import { resultStatus } from "../game-commons";

const { ccclass } = _decorator;
const { FormatUtils } = gc;

export type BetDetailLogItemType = {
    betDetailsLog: gc.BetHistory.DynamicObject<object>;
    index: number;
    odds: gc.BetHistory.DynamicObject<number>;
    settlementResult: gc.BetHistory.DynamicObject<any>;
    result: gc.BetHistory.DynamicObject<object>;
    freeBet: boolean;
    fractionalOddsFormat: boolean;
};

export const handRankingIdMap = {
    5: "sixDevil",
    4: "twin",
    3: "small",
    2: "big",
    1: "qiuQiu",
    0: "ordinaryCard",
};

@ccclass
export default class BetDetailBodyItem extends BetDetailLogItem {
    setData(data: BetDetailLogItemType) {
        const { betDetailsLog } = data;
        const { amount, choice } = betDetailsLog as GameRoundBetDetailsLog & gc.BetHistory.DynamicObject<object>;
        super.setData(data);

        const winningAmount = amount * this.getEffectiveOdds(choice, data);
        this.lblWin.string = FormatUtils.numberWithCommas(winningAmount, 2);
        this.lblOdds.string = this.getDisplayOdd(choice, data);
        const isHightLight = this.checkWinning(choice, data, resultStatus.Win) || this.checkWinning(choice, data, resultStatus.Tie);
        this.setHighlightTicketDetail(isHightLight);
    }

    getEffectiveOdds(choice: string, data: BetDetailLogItemType) {
        const winningOdd = this.getWinningOdd(choice, data);
        if (data.freeBet) {
            return this.checkWinning(choice, data, resultStatus.Win) ? winningOdd - 1 : 0;
        } else {
            return winningOdd;
        }
    }

    getDisplayOdd(choice: string, data: BetDetailLogItemType) {
        const winningOdd = this.getWinningOdd(choice, data);
        if (this.checkWinning(choice, data, resultStatus.Win)) {
            return (data.fractionalOddsFormat ? FormatUtils.numberWithCommas(winningOdd - 1, 2) : winningOdd).toString();
        } else {
            return "-";
        }
    }

    getWinningOdd(choice: string, data: BetDetailLogItemType) {
        let winningOdd = 0;
        if (this.checkWinning(choice, data, resultStatus.Win)) {
            const oddName = handRankingIdMap[data.result[choice]["handRankingId"]];
            winningOdd = data.odds[oddName];
        } else if (this.checkWinning(choice, data, resultStatus.Tie)) {
            winningOdd = 1;
        }

        return winningOdd;
    }

    checkWinning(choice: string, data: BetDetailLogItemType, status: number): boolean {
        return data.settlementResult[choice] === status;
    }

    parseOddByData(data) {} // game have odds different with choice
}
