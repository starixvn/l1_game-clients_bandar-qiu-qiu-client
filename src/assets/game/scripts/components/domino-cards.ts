import { _decorator, Component } from "cc";
import { DominoCard } from "../../../../extensions/shared-components/assets/game/domino/scripts/domino-card";
const { ccclass, property } = _decorator;

@ccclass("DominoCards")
export class DominoCards extends Component {
    @property(DominoCard)
    dominoCards: DominoCard[] = [];
}
