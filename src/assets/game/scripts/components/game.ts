import gc from "@sg/game-client-base";
import { Label, Node, _decorator, warn } from "cc";
import GameComponent from "db://shared-components/game/scripts/components/game-component";
import { startGame } from "db://shared-components/shared/scripts/startup";
import { FunctionUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { siteConfigs } from "../../../scripts/site-configs";
import { containerOptions, settings } from "../game-settings";
import "./../../../resources/i18n";
import { IResultInfo, TResult } from "./game-commons";
import { PunterDominoCards } from "./punter-domino-cards";

startGame(settings.name, containerOptions, siteConfigs);

const { RoundHistories } = gc;
const { ccclass, property } = _decorator;
const { observer, render } = Observer;

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
    protected punterCardsComp: PunterDominoCards = null;

    onLoad() {
        super.onLoad();
        this.punterCardsComp = this.punterCards?.getComponent(PunterDominoCards);
    }

    @render(RoundHistories.RoundHistoryStore, (store) => store.joinGameHistory)
    handleJoinGameAndShowResult(joinGameHistory: gc.RoundHistories.IJoinGameHistory) {
        const { roundHistory, isShow } = joinGameHistory ?? {};
        if (roundHistory && isShow) {
            this.showResult(roundHistory?.result, false, roundHistory?.settlementResult);
            this.punterCardsComp?.updateGameResultsInfo(roundHistory?.result, roundHistory?.settlementResult);
        }
    }

    async handleStartRound(isStartRound: boolean) {
        if (isStartRound && this.punterCardsComp) {
            super.handleStartRound(isStartRound);

            await this.punterCardsComp?.hideDominoCards();
            try {
                await FunctionUtils.asyncExecute(this.node, this.punterCardsComp?.drawDominoCardsPunter());
            } catch (error) {
                warn("An error occurred when drawDominoCardsPunter", error);
            }
        }
    }

    async showResult(
        result: gc.GameServiceMessage.TResult,
        hasAnimation: boolean,
        settlementResult: gc.GameServiceMessage.TSettlementResult
    ) {
        if (result && settlementResult) {
            this.renderResultDominoCards(result as TResult);

            if (hasAnimation) {
                try {
                    await FunctionUtils.asyncExecute(this.node, this.punterCardsComp?.openDominoCards(result, settlementResult));
                } catch (error) {
                    warn("An error occurred when openDominoCards", error);
                }
            } else {
                this.punterCardsComp.openDominoCardsWithoutAnim();
            }
        }
    }

    private renderResultDominoCards(result: TResult) {
        this.renderResultDominoCardsBanker(result.banker);
        this.renderResultDominoCardsPlayers(result);
    }

    renderResultDominoCardsBanker(resultInfo: IResultInfo) {
        this.punterCardsComp?.banker?.dominoCards?.forEach((dominoCard, index) => {
            dominoCard.setDominoCard({ top: +resultInfo?.dominoes[index][0], bottom: +resultInfo?.dominoes[index][1] });
        });
    }

    renderResultDominoCardsPlayers(result: TResult) {
        this.punterCardsComp?.players?.forEach((player, index) => {
            const resultInfo = this.punterCardsComp?.getResultInfoPlayerByIndex(index, result);
            resultInfo &&
                player?.dominoCards?.forEach((dominoCard, cardIndex) => {
                    dominoCard.setDominoCard({ top: +resultInfo?.dominoes[cardIndex][0], bottom: +resultInfo?.dominoes[cardIndex][1] });
                });
        });
    }
}
