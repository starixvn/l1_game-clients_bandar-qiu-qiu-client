import gc from "@sg/game-client-base";
import { Label, _decorator } from "cc";
import GameComponent from "db://shared-components/game/scripts/components/game-component";
import { WinningResult } from "db://shared-components/shared/common-components/winning-result/scripts/winning-result";
import { startGame } from "db://shared-components/shared/scripts/startup";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { siteConfigs } from "../../../scripts/site-configs";
import { containerOptions, settings } from "../game-settings";
import "./../../../resources/i18n";
const { Settlements, Rounds, Translator } = gc;

const { movingNode, getPositionAtDestNode, playSpine, fadeOut, fadeIn } = AnimationUtils;

startGame(settings.name, containerOptions, siteConfigs);

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
@observer(settings.name)
export default class Game extends GameComponent {
    @property({ type: Label, override: true, visible: false })
    lblMinBet: Label = null;

    @property({ type: Label, override: true, visible: false })
    lblMaxBet: Label = null;

    @property(WinningResult)
    winningResult: WinningResult = null;

    override namespace = settings.name;
    override containerOptions = containerOptions;

    onLoad() {
        super.onLoad();
    }
}
