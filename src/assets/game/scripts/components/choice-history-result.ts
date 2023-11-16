import gc from "@sg/game-client-base";
import { HistoryResult } from "db://shared-components/game/history-result/scripts/history-result";
import { _decorator } from "cc";

const { ccclass } = _decorator;

@ccclass("ChoiceHistoryResult")
export default class ChoiceHistoryResult extends HistoryResult {
    public setHistoryResultInfo(rounds: gc.RoundHistories.RoundHistory[]) {
        this.containerItem.active = rounds.length > 0;
        super.setHistoryResultInfo(rounds.slice(0, 10));
    }
}
