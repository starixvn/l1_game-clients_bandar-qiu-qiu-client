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
        const choices = ["banker", "spade", "heart", "club", "diamond"];
        choices.forEach((choice, index) => {
            this.createResultItemByChoice(choice, result[choice], this.getIsWin(choice, settlementResult), index);
        });        
    }

    private getIsWin(choice: string, settlementResult: gc.BetHistory.DynamicObject<any>): boolean{
        return settlementResult[choice] === 1;
    }

    private createResultItemByChoice(choice: string, resultByChoice: any, isWin: boolean, index: number){
        const item = instantiate(this.itemPrefab);
        this.layout.node.addChild(item);
        const resultItemInstance = item.getComponent(ResultItemByChoice);
        resultItemInstance.setData(choice, resultByChoice, isWin, index);
    }
}
