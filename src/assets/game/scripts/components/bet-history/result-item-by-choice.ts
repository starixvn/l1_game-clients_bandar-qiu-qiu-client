import gc from "@sg/game-client-base";
import { Color, Component, Label, Node, Prefab, _decorator, instantiate } from "cc";
import { DominoCard } from "db://shared-components/game/domino/scripts/domino-card";

const { ccclass, property } = _decorator;

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
    lblChoice: Label = null;

    @property(Label)
    lblHandRanking: Label = null;

    @property(Label)
    lblPipsOfSet: Label = null;

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
        this.lblChoice.string = Translator.gameTranslate(`glossary_${choice}`);

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
        dominoCard.faceUp();
    }

    showHandRanking(resultByChoice: any, isWin: boolean) {
        const { handRankingId, pipsOfSet } = resultByChoice;
        const lblTarget = this.getLblFollowRankingId(handRankingId);
        lblTarget.string =
            handRankingId === 0
                ? `${pipsOfSet[0]} : ${pipsOfSet[1]}`
                : Translator.gameTranslate(`glossary_${HandRankingMap[handRankingId]}`);

        this.setHighlight(lblTarget, isWin);
    }

    setHighlight(lblTarget: Label, highlight: boolean) {
        const color = highlight ? Color.YELLOW : Color.WHITE;
        lblTarget.color = color;
    }

    getLblFollowRankingId(handRankingId: number) {
        const lblTarget = handRankingId === 0 ? this.lblPipsOfSet : this.lblHandRanking;

        this.lblHandRanking.node.active = handRankingId !== 0;
        this.lblPipsOfSet.node.active = handRankingId === 0;

        return lblTarget;
    }
}
