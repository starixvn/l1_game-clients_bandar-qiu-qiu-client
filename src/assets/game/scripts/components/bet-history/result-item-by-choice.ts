import { _decorator, Component, Node, Label, Prefab, instantiate, Color } from "cc";
const { ccclass, property } = _decorator;
import { DominoCard, DominoCardModel } from "db://shared-components/game/domino/scripts/domino-card";
import gc from "@sg/game-client-base";
const { Translator } = gc;

const HandRankingMap = {
    0: "hand_ranking_ordinary",
    1: "hand_ranking_qiuqiu",
    2: "hand_ranking_big",
    3: "hand_ranking_small",
    4: "hand_ranking_twin",
    5: "hand_ranking_six_devil",
};

@ccclass("ResultItemByChoice")
export class ResultItemByChoice extends Component {
    @property(Prefab)
    dominoPrefab: Prefab = null;

    @property(Label)
    choiceLabel: Label = null;

    @property(Label)
    handRankingLabel: Label = null;

    @property(Node)
    domino1Node: Node = null;

    @property(Node)
    domino2Node: Node = null;

    @property(Node)
    domino3Node: Node = null;

    @property(Node)
    domino4Node: Node = null;

    @property(Node)
    bg: Node = null;

    setData(choice: string, resultByChoice: any, isWin: boolean, activeBacground: boolean) {
        this.choiceLabel.string = Translator.gameTranslate(`glossary_${choice}`);
        this.setDomino(this.domino1Node, resultByChoice.dominoes[0]);
        this.setDomino(this.domino2Node, resultByChoice.dominoes[1]);
        this.setDomino(this.domino3Node, resultByChoice.dominoes[2]);
        this.setDomino(this.domino4Node, resultByChoice.dominoes[3]);
        this.showHandRanking(resultByChoice, isWin);
        this.bg.active = activeBacground;
    }

    setDomino(dominoNode: Node, dominoValue: string) {
        const domino = instantiate(this.dominoPrefab);
        dominoNode.addChild(domino);
        const dominoCard = domino.getComponent(DominoCard);
        dominoCard.setDominoCard({ top: +dominoValue[0], bottom: +dominoValue[1] });
        dominoCard.openDominoCard();
    }

    showHandRanking(resultByChoice: any, isWin: boolean) {
        let txt = "";
        if (resultByChoice.handRankingId === 0) {
            txt = `${resultByChoice.pipsOfSet[0]}:${resultByChoice.pipsOfSet[1]}`;
        } else {
            txt = Translator.gameTranslate(`glossary_${HandRankingMap[resultByChoice.handRankingId]}`);
        }

        this.handRankingLabel.string = txt;
        this.setHighlight(isWin);
    }

    setHighlight(highlight: boolean) {
        const color = highlight ? Color.YELLOW : Color.WHITE;
        this.handRankingLabel.color = color;
    }
}
