import gc from "@sg/game-client-base";
import { Color, Label, Sprite, SpriteFrame, _decorator } from "cc";
import { LedLightTooltip } from "db://shared-components/game/led-light/scripts/components/led-light-tooltip";
import { ServiceCard, convertRank } from "db://shared-components/game/poker-cards/scripts/poker-card";
import { ComponentUtils } from "db://shared-components/shared/utils";
import { BetChoice } from "../game-commons";
const { ccclass, property } = _decorator;

enum ColorResult {
    dragon = "#0691f2",
    tiger = "#eba807",
    tie = "#08c826",
}
@ccclass("CustomLedLightTooltip")
export class CustomLedLightTooltip extends LedLightTooltip {
    @property(Label)
    lblDragonValue: Label = null;

    @property(Sprite)
    spriteCardDragon: Sprite = null;

    @property(Label)
    lblTigerValue: Label = null;

    @property(Sprite)
    spriteCardTiger: Sprite = null;

    @property({ type: SpriteFrame })
    cardTypeSprite: SpriteFrame[] = [];

    protected onLoad(): void {
        super.onLoad();
        ComponentUtils.setEmptyLabels([this.lblDragonValue, this.lblTigerValue]);
    }

    public setTooltipInfo(ledLightInfo: gc.RoundHistories.RoundHistory) {
        this.roundId.string = `#${ledLightInfo.roundId}`;
        const winChoice = this.findWinningChoice(ledLightInfo);
        const name = gc.Translator.gameTranslate(`glossary_${winChoice}`);
        this.result.string = name.toUpperCase();
        this.result.color = new Color(ColorResult[winChoice]);
        this.showCardInfo(ledLightInfo?.result?.dragon, this.lblDragonValue, this.spriteCardDragon);
        this.showCardInfo(ledLightInfo?.result?.tiger, this.lblTigerValue, this.spriteCardTiger);
        this.showTooltip();
    }

    protected findWinningChoice(ledLightInfo: gc.RoundHistories.RoundHistory): string {
        const choices = [BetChoice.Dragon, BetChoice.Tiger, BetChoice.Tie];
        let winChoice = "";

        choices.forEach((choice) => {
            if (ledLightInfo.settlementResult[choice]) {
                winChoice = choice;
            }
        });

        return winChoice;
    }

    protected showCardInfo(card: ServiceCard, label: Label, sprite: Sprite) {
        if (card) {
            const cardRank = convertRank(card.rank);
            label.string = cardRank;
            sprite.spriteFrame = this.cardTypeSprite[card.suit];
        } else {
            label.string = "";
            sprite.spriteFrame = null;
        }
    }
}
