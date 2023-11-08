import { _decorator } from "cc";
import gc from "@sg/game-client-base";
import {
    BetDetailLogItemType,
    GameRoundBetDetailsLog,
} from "db://shared-components/game/bet-history/scripts/components/bet-detail/bet-detail-log-item";
import BetDetailLogItem from "db://shared-components/game/bet-history/scripts/components/bet-detail/bet-detail-log-item";

const { ccclass } = _decorator;
const { FormatUtils } = gc;

@ccclass
export default class BetDetailBodyItem extends BetDetailLogItem {
    setData(data: BetDetailLogItemType) {
        const { betDetailsLog, odds, settlementResult, result, freeBet, fractionalOddsFormat } = data;
        const { amount, choice } = betDetailsLog as GameRoundBetDetailsLog & gc.BetHistory.DynamicObject<object>;
        const isWin = settlementResult[choice];
        super.setData(data);

        const winningOdd = 0;
        const effectiveOdds = freeBet ? winningOdd - 1 : winningOdd;
        const winningAmount = amount * effectiveOdds;
        this.lblWin.string = FormatUtils.numberWithCommas(winningAmount, 2);
        this.setHighlightTicketDetail(winningAmount > amount);

        this.lblOdds.string = "-";
    }
}
