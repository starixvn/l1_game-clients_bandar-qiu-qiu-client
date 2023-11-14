import { _decorator, Component, Label } from "cc";
import { DominoCard } from "../../../../extensions/shared-components/assets/game/domino/scripts/domino-card";
const { ccclass, property } = _decorator;

@ccclass("DominoCards")
export class DominoCards extends Component {
    @property(DominoCard)
    dominoCards: DominoCard[] = [];

    @property(Label)
    lblResult: Label = null;

    onLoad(): void {
        this.resetDefaultResult();
    }

    setResult(pipsOfSet: number[]) {
        pipsOfSet.length > 0 && (this.lblResult.string = `${pipsOfSet[0]} : ${pipsOfSet[1]}`);
    }

    resetDefaultResult() {
        this.lblResult.string = "? : ?";
    }

    async handleOpenDominoCards() {
        for (const dominoCard of this.dominoCards) {
            await dominoCard.openDominoCard();
        }
    }

    handleOpenDominoCardsWithoutAnim() {
        this.dominoCards.forEach((dominoCard) => {
            dominoCard.faceUp();
        });
    }
}
