import { Color, Component, Label, _decorator } from "cc";
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

    setPipsOfSetResult(pipsOfSet: number[]) {
        if (pipsOfSet.length > 0) {
            this.lblResult.string = `${pipsOfSet[0]} : ${pipsOfSet[1]}`;
        }
    }

    setHandRankingResult(text: string) {
        this.lblResult.string = text;
    }

    resetDefaultResult() {
        this.lblResult.string = "? : ?";
    }

    async handleOpenDominoCards() {
        await Promise.all(this.dominoCards.map((dominoCard) => dominoCard.openDominoCardAnim()));
    }

    handleOpenDominoCardsWithoutAnim() {
        this.dominoCards.forEach((dominoCard) => {
            dominoCard.faceUp();
        });
    }

    setColorResult(color: string) {
        color && (this.lblResult.color = new Color(color));
    }
}
