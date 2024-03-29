import gc from "@sg/game-client-base";
import { Node, UIOpacity, Vec3, _decorator, warn } from "cc";
import { DominoCard } from "db://shared-components/game/domino/scripts/domino-card";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils, FunctionUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { DominoCards } from "./domino-cards";
import { IResultInfo, TResult, handRankingIdMapText, resultStatusColorMapping } from "./game-commons";
const { ccclass, property } = _decorator;

const { Configs, Rounds, Translator } = gc;
const { movingNode, getPositionAtDestNode, fadeOutAndDeactivate } = AnimationUtils;
const { render, handle } = Observer;

enum PunterCardsResultMapping {
    Spade = 0,
    Heart,
    Club,
    Diamond,
}

@ccclass("PunterDominoCards")
export class PunterDominoCards extends ObserverComponent {
    @property(DominoCards)
    banker: DominoCards = null;

    @property(DominoCards)
    players: DominoCards[] = [];

    @property(Node)
    nodeDominoCardBox: Node = null;

    protected dominoCards: DominoCard[] = [];
    private readonly originalDominoCardsPositions: Vec3[] = [];
    private systemType = Configs.SystemConfigs.SG.name;
    protected delayTimeOpenFourDominoes = 0.7;
    protected delayTimeDrawEachDomino = 0.05;
    protected delayTimeDrawFourDominoes = 0.3;
    protected durationHideDominos = 0.3;
    protected durationDrawDomino = 0.15;

    onLoad(): void {
        super.onLoad();

        this.loadDominoCards(this.banker?.dominoCards, this.originalDominoCardsPositions);
        this.players.forEach((player) => {
            this.loadDominoCards(player?.dominoCards, this.originalDominoCardsPositions);
        });
    }

    private loadDominoCards(cards: DominoCard[] | undefined, positionArray: Vec3[]): void {
        cards?.forEach((dominoCard) => {
            if (dominoCard) {
                this.processSingleDominoCard(dominoCard, positionArray);
            }
        });
    }

    private processSingleDominoCard(dominoCard: DominoCard, positionArray: Vec3[]): void {
        dominoCard.setBackDominoCardSystem();
        this.dominoCards.push(dominoCard);
        positionArray.push(new Vec3(dominoCard.node.position));
    }

    async hideDominoCards() {
        try {
            await FunctionUtils.asyncExecute(
                this.node,
                Promise.all(
                    (this.dominoCards || []).map(async (dominoCard) => {
                        if (dominoCard) {
                            await fadeOutAndDeactivate(dominoCard.node, this.durationHideDominos);
                        }
                    })
                )
            );
        } catch (error) {
            warn("An error occurred when hideDominoCards", error);
        }
    }

    async drawDominoCardsPunter() {
        try {
            for (let i = 0; i < this.dominoCards.length; i++) {
                const dominoCard = this.dominoCards[i];
                const isFirstCard = i === 0;
                const isLastCard = i === this.dominoCards.length - 1;
                const isIndexDivisibleBy4 = (i + 1) % 4 === 0;

                if (dominoCard) {
                    this.prepareDominoCard(dominoCard);
                    this.animateDominoCard(dominoCard, this.durationDrawDomino, i);
                }

                await FunctionUtils.asyncExecute(dominoCard?.node, this.applyDominoCardDelay(isIndexDivisibleBy4, isLastCard));
                this.handlePlaySound(isIndexDivisibleBy4, isLastCard, isFirstCard);
            }
        } catch (error) {
            warn("An error occurred when drawDominoCards", error);
        }
    }

    protected prepareDominoCard(dominoCard: DominoCard) {
        dominoCard.node.active = true;
        dominoCard.node.getComponent(UIOpacity).opacity = 255;
        dominoCard.faceDown();
        const destPosition = getPositionAtDestNode(dominoCard.node, this.nodeDominoCardBox);
        dominoCard.node.position = destPosition;
    }

    protected animateDominoCard(dominoCard: DominoCard, drawDuration: number, index: number) {
        movingNode(dominoCard.node, drawDuration, this.originalDominoCardsPositions[index]);
        FunctionUtils.asyncExecute(dominoCard?.node, dominoCard.drawDominoCard(drawDuration));
    }

    protected async applyDominoCardDelay(isIndexDivisibleBy4: boolean, isLastCard: boolean) {
        if (!isIndexDivisibleBy4 && !isLastCard) {
            await AnimationUtils.delayTime(this.delayTimeDrawEachDomino);
        }

        if (isIndexDivisibleBy4 && !isLastCard) {
            await AnimationUtils.delayTime(this.delayTimeDrawFourDominoes);
        }
    }

    protected handlePlaySound(isIndexDivisibleBy4: boolean, isLastCard: boolean, isFirstCard: boolean) {
        if (isFirstCard || (isIndexDivisibleBy4 && !isLastCard)) {
            this.playSound(gc.Audios.AudioIds.DRAW_SINGLE_DOMINO_CARD);
        }
    }

    async openDominoCards(result: gc.GameServiceMessage.TResult, settlementResult: gc.GameServiceMessage.TSettlementResult) {
        try {
            await FunctionUtils.asyncExecute(this.banker?.node, this.banker.handleOpenDominoCards());
            this.handleResultInfoBanker(result);
            await AnimationUtils.delayTime(this.delayTimeOpenFourDominoes);

            for (let index = 0; index < this.players.length; index++) {
                const player = this.players[index];
                const isLastCard = index === this.players.length - 1;
                await FunctionUtils.asyncExecute(player?.node, player.handleOpenDominoCards());
                this.handleResultInfoPlayer(result, settlementResult, index, player);
                !isLastCard && (await AnimationUtils.delayTime(this.delayTimeOpenFourDominoes));
            }
        } catch (error) {
            warn("An error occurred when openDominoCards", error);
        }
    }

    openDominoCardsWithoutAnim() {
        this.banker.handleOpenDominoCardsWithoutAnim();
        for (const player of this.players) {
            player.handleOpenDominoCardsWithoutAnim();
        }
    }

    @render(Configs.SiteConfigs, (store) => store.systemType)
    setSystemType(systemType: string) {
        systemType && (this.systemType = systemType);
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }

    @render(Rounds.RoundTimeStore, (store) => store.isStartingRound)
    resetResult(isStartingRound: boolean) {
        if (isStartingRound) {
            this.banker.resetDefaultResult();
            this?.players?.forEach((player) => {
                player?.resetDefaultResult();
                player?.setColorResult(resultStatusColorMapping[0]);
            });
        }
    }

    updateGameResultsInfo(result: gc.GameServiceMessage.TResult, settlementResult: gc.GameServiceMessage.TSettlementResult) {
        if (settlementResult && result) {
            this.handleResultInfoBanker(result);
            this.handleResultInfoPlayers(result, settlementResult);
        }
    }

    protected handleResultInfoBanker(result: gc.GameServiceMessage.TResult) {
        this.handleResultInfo(result?.banker, this.banker);
    }

    protected handleResultInfoPlayers(result: gc.GameServiceMessage.TResult, settlementResult: gc.GameServiceMessage.TSettlementResult) {
        this.players?.forEach((player, index) => {
            this.handleResultInfoPlayer(result, settlementResult, index, player);
        });
    }

    protected handleResultInfoPlayer(
        result: gc.GameServiceMessage.TResult,
        settlementResult: gc.GameServiceMessage.TSettlementResult,
        index: number,
        dominoCards: DominoCards
    ) {
        const resultInfo = this.getResultInfoPlayerByIndex(index, result as TResult);
        const color = this.getColorResultInfoPlayer(settlementResult, index);
        resultInfo && this.handleResultInfo(resultInfo, dominoCards, color);
    }

    getResultInfoPlayerByIndex(index: number, result: TResult): IResultInfo | undefined {
        switch (index) {
            case PunterCardsResultMapping.Spade:
                return result?.spade;
            case PunterCardsResultMapping.Heart:
                return result?.heart;
            case PunterCardsResultMapping.Club:
                return result?.club;
            case PunterCardsResultMapping.Diamond:
                return result?.diamond;
            default:
                return undefined;
        }
    }

    protected getColorResultInfoPlayer(settlementResult: gc.GameServiceMessage.TSettlementResult, playerIndex) {
        const suitsOrder = ["spade", "heart", "club", "diamond"];
        const valueFollowSuit: number[] = suitsOrder.map((suit) => {
            return +settlementResult[suit];
        });

        return resultStatusColorMapping[valueFollowSuit[playerIndex]] || resultStatusColorMapping[0];
    }

    protected handleResultInfo(resultInfo: IResultInfo, dominoCards: DominoCards, color?: string) {
        const handRankingId = resultInfo?.handRankingId || 0;
        if (handRankingId > 0) {
            const translatedKey = this.getTranslateKey(handRankingIdMapText[resultInfo.handRankingId]);
            dominoCards.setHandRankingResult(translatedKey);
        } else {
            dominoCards.setPipsOfSetResult(resultInfo?.pipsOfSet);
        }

        color && dominoCards.setColorResult(color);
    }

    protected getTranslateKey(key: string) {
        return Translator.gameTranslate(`glossary_hand_ranking_${key}`)?.toUpperCase();
    }
}
