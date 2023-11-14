import gc from "@sg/game-client-base";
import { _decorator, Prefab, Layout, instantiate, Node } from "cc";
import { BaseResultBodyItem } from "db://shared-components/game/bet-history/scripts/components/bet-history-body-item";
import { ResultItemByChoice } from "./result-item-by-choice";

const { ccclass, property } = _decorator;

@ccclass("BandarQiuQiuResultItemByChoice")
export default class ResultBodyItem extends BaseResultBodyItem {
    @property(Prefab)
    itemPrefab: Prefab = null;

    @property(Node)
    bankerNode: Node = null;

    @property(Node)
    spadeNode: Node = null;

    @property(Node)
    clubNode: Node = null;

    @property(Node)
    heartNode: Node = null;

    @property(Node)
    diamondNode: Node = null;

    setData(result: any, settlementResult: gc.BetHistory.DynamicObject<any>) {
        const choices = ["banker", "spade", "heart", "club", "diamond"];

        choices.forEach((choice) => {
            this.createResultItemByChoice(
                this[`${choice}Node`],
                choice,
                result[choice],
                this.getIsWin(choice, settlementResult),
                choice !== "banker"
            );
        });
    }

    private getIsWin(choice: string, settlementResult: gc.BetHistory.DynamicObject<any>): boolean {
        return settlementResult[choice] === 1;
    }

    private createResultItemByChoice(targetNode: Node, choice: string, resultByChoice: any, isWin: boolean, activeBacground: boolean) {
        const item = instantiate(this.itemPrefab);

        const resultItemInstance = item.getComponent(ResultItemByChoice);
        resultItemInstance.setData(choice, resultByChoice, isWin, activeBacground);

        targetNode?.addChild(item);
    }
}
