import { _decorator } from "cc";
import gc from "@sg/game-client-base";
import {
    GameRoundBetDetailsLog,
} from "db://shared-components/game/bet-history/scripts/components/bet-detail/bet-detail-log-item";
import BetDetailLogItem from "db://shared-components/game/bet-history/scripts/components/bet-detail/bet-detail-log-item";

const { ccclass } = _decorator;
const { FormatUtils, Translator } = gc;

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
        const { betDetailsLog, freeBet } = data;
        const { amount, choice } = betDetailsLog as GameRoundBetDetailsLog & gc.BetHistory.DynamicObject<object>;
        super.setData(data);

        const winningOdd = this.getWinningOdd(choice, data);
        const effectiveOdds = freeBet ? winningOdd - 1 : winningOdd;
        const winningAmount = amount * effectiveOdds;
        this.lblWin.string = FormatUtils.numberWithCommas(winningAmount, 2);
        this.setHighlightTicketDetail(winningAmount > amount);

        this.lblOdds.string = winningOdd === 0 ? "-" : winningOdd.toString();
    }

    getWinningOdd(choice: string, data: BetDetailLogItemType){
        const isWin = data.settlementResult[choice];
        let winningOdd = 0;
        if(isWin === 1){
            const oddName = handRankingIdMap[data.result[choice]["handRankingId"]];
            winningOdd = data.odds[oddName];
        }else if(isWin === 2){
            winningOdd = 1;
        }

        return winningOdd;
    }
}
