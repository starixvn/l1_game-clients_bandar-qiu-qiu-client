import gc from "@sg/game-client-base";
import { Label, Node, _decorator } from "cc";
import GameComponent from "db://shared-components/game/scripts/components/game-component";
import { startGame } from "db://shared-components/shared/scripts/startup";
import Observer from "observer";
import { siteConfigs } from "../../../scripts/site-configs";
import { containerOptions, settings } from "../game-settings";
import "./../../../resources/i18n";
import { DominoCards } from "./domino-cards";
import { handRankingIdMapText } from "./dtf-commons";
import { PunterDominoCards } from "./punter-domino-cards";

startGame(settings.name, containerOptions, siteConfigs);

const { Rounds, Settlements, Translator } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

type Result = {
    banker: ResultInfo;
    spade: ResultInfo;
    heart: ResultInfo;
    club: ResultInfo;
    diamond: ResultInfo;
};

type ResultInfo = {
    dominoes: number[];
    handRankingId: number;
    pipsOfSet: number[];
};

@ccclass
@observer(settings.name)
export default class Game extends GameComponent {
    @property({ type: Label, override: true, visible: false })
    lblMinBet: Label = null;

    @property({ type: Label, override: true, visible: false })
    lblMaxBet: Label = null;

    @property(Node)
    punterCards: Node = null;

    override namespace = settings.name;
    override containerOptions = containerOptions;
    punterCardsComp: PunterDominoCards = null;

    onLoad() {
        super.onLoad();
        this.punterCardsComp = this.punterCards?.getComponent(PunterDominoCards);
        if (this.punterCardsComp) {
            this.punterCardsComp.playSoundDrawDominoCard = () => {
                return this.playSound(gc.Audios.AudioIds.DRAW_SINGLE_CARD);
            };
        }
    }

    async handleStartRound(isStartRound: boolean) {
        if (isStartRound && this.punterCardsComp) {
            super.handleStartRound(isStartRound);

            this.punterCardsComp.hideDominoCards();
            await this.punterCardsComp.drawDominoCardsPunter();
        }
    }

    async showResult(result: gc.GameServiceMessage.TResult, hasAnimation: boolean) {
        if (result) {
            this.renderResultDominoCards(result as Result);

            if (hasAnimation) {
                await this.punterCardsComp.openDominoCards();
            } else {
                this.punterCardsComp.openDominoCardsWithoutAnim();
            }
        }
    }

    private renderResultDominoCards(result: Result) {
        this.renderResultDominoCardsBanker(result.banker);
        this.renderResultDominoCardsPlayers(result);
    }

    renderResultDominoCardsBanker(resultInfo: ResultInfo) {
        this.handleResultInfo(resultInfo, this.punterCardsComp?.banker);
        this.punterCardsComp?.banker?.dominoCards?.forEach((dominoCard, index) => {
            dominoCard.setDominoCard({ top: +resultInfo?.dominoes[index][0], bottom: +resultInfo?.dominoes[index][1] });
        });
    }

    renderResultDominoCardsPlayers(result: Result) {
        this.punterCardsComp?.players?.forEach((player, index) => {
            let resultInfo: ResultInfo;
            switch (index) {
                case 0:
                    resultInfo = result?.spade;
                    break;
                case 1:
                    resultInfo = result?.heart;
                    break;
                case 2:
                    resultInfo = result?.club;
                    break;
                case 3:
                    resultInfo = result?.diamond;
                    break;
            }
            this.handleResultInfo(resultInfo, player);
            player?.setPipsOfSetResult(resultInfo?.pipsOfSet);
            player?.dominoCards?.forEach((dominoCard) => {
                dominoCard.setDominoCard({ top: +resultInfo?.dominoes[index][0], bottom: +resultInfo?.dominoes[index][1] });
            });
        });
    }

    handleResultInfo(resultInfo: ResultInfo, dominoCards: DominoCards) {
        const handRankingId = resultInfo?.handRankingId || 0;

        if (handRankingId > 0) {
            const translatedKey = this.getTranslateKey(handRankingIdMapText[resultInfo.handRankingId]);
            dominoCards.setHandRankingResult(translatedKey);
        } else {
            dominoCards.setPipsOfSetResult(resultInfo?.pipsOfSet);
        }
    }

    getTranslateKey(key: string) {
        return Translator.gameTranslate(`glossary_hand_ranking_${key}`)?.toUpperCase();
    }

    @render(gc.Rounds.RoundTimeStore, (store) => store.isStartingRound)
    resetResult(isStartingRound: boolean) {
        if (isStartingRound) {
            this.punterCardsComp.banker.resetDefaultResult();
            this.punterCardsComp?.players?.forEach((player) => {
                player?.resetDefaultResult();
            });
        }
    }
}
