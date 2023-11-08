import gc from "@sg/game-client-base";
import { _decorator } from "cc";
import { BaseResultBodyItem } from "db://shared-components/game/bet-history/scripts/components/bet-history-body-item";

const { ccclass, property } = _decorator;

@ccclass
export default class ResultBodyItem extends BaseResultBodyItem {
    setData(result: any, settlementResult: gc.BetHistory.DynamicObject<boolean>) {}
}
