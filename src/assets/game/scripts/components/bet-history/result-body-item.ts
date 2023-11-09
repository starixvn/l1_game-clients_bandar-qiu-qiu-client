import gc from "@sg/game-client-base";
import { _decorator, Prefab, Layout, instantiate } from "cc";
import { BaseResultBodyItem } from "db://shared-components/game/bet-history/scripts/components/bet-history-body-item";
import { ResultItemByChoice } from "./result-item-by-choice";

const { ccclass, property } = _decorator;

@ccclass
export default class ResultBodyItem extends BaseResultBodyItem {
    @property(Prefab)
    itemPrefab: Prefab = null;

    @property(Layout)
    layout: Layout = null;
    
    setData(result: any, settlementResult: gc.BetHistory.DynamicObject<any>) {
        this.createResultItemByChoice("banker", result["banker"], this.getIsWin("banker", settlementResult));
        this.createResultItemByChoice("spade", result["spade"], this.getIsWin("spade", settlementResult));
        this.createResultItemByChoice("heart", result["heart"], this.getIsWin("heart", settlementResult));
        this.createResultItemByChoice("club", result["club"], this.getIsWin("club", settlementResult));
        this.createResultItemByChoice("diamond", result["diamond"], this.getIsWin("diamond", settlementResult));
    }

    private getIsWin(choice: string, settlementResult: gc.BetHistory.DynamicObject<any>): boolean{
        return settlementResult[choice] === 1;
    }

    private createResultItemByChoice(choice: string, resultByChoice: any, isWin: boolean){
        const item = instantiate(this.itemPrefab);
        this.layout.node.addChild(item);
        const resultItemInstance = item.getComponent(ResultItemByChoice);
        resultItemInstance.setData(choice, resultByChoice, isWin);
    }
}
