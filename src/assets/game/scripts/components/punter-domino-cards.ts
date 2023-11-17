import gc from "@sg/game-client-base";
import { Node, Vec3, _decorator, warn } from "cc";
import { DominoCard } from "db://shared-components/game/domino/scripts/domino-card";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils, FunctionUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { DominoCards } from "./domino-cards";
import { IResultInfo, TResult, handRankingIdMapText, resultStatusColorMapping } from "./game-commons";
const { ccclass, property } = _decorator;

const { Configs, Rounds, Translator } = gc;
const { movingNode, getPositionAtDestNode } = AnimationUtils;
const { render, handle } = Observer;

type OriginalDominoCardPlayersPosition = {
    [playerIndex: number]: Vec3[];
};

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

    dominoCards: DominoCard[] = [];

    private readonly originalDominoCardBankerPosition: Vec3[] = [];
    private originalDominoCardPlayersPosition: OriginalDominoCardPlayersPosition = {};
    private systemType = Configs.SystemConfigs.SG.name;

    onLoad(): void {
        super.onLoad();

        this.initializeOriginalDominoCardPlayersPosition();
        this.onLoadBankerDominoCards();
        this.onLoadPlayersDominoCards();
    }

    private initializeOriginalDominoCardPlayersPosition(): void {
        const numberOfPlayers = this.players.length || 0;

        for (let playerIndex = 0; playerIndex < numberOfPlayers; playerIndex++) {
            this.originalDominoCardPlayersPosition[playerIndex] = [];
        }
    }

    private processDominoCardArray(cards: DominoCard[], positionArray: Vec3[]): void {
        cards?.forEach((dominoCard) => {
            if (dominoCard) {
                this.processSingleDominoCard(dominoCard, positionArray);
            }
        });
    }

    private onLoadBankerDominoCards(): void {
        this.processDominoCardArray(this.banker?.dominoCards, this.originalDominoCardBankerPosition);
    }

    private onLoadPlayersDominoCards(): void {
        this.players.forEach((player, playerIndex) => {
            player?.dominoCards.forEach((dominoCard) => {
                if (dominoCard) {
                    this.processSingleDominoCard(dominoCard, this.originalDominoCardPlayersPosition[playerIndex]);
                }
            });
        });
    }

    private processSingleDominoCard(dominoCard: DominoCard, positionArray: Vec3[]): void {
        dominoCard.setBackDominoCardSystem(this?.systemType);
        this.dominoCards.push(dominoCard);
        positionArray.push(new Vec3(dominoCard.node.position));
    }

    hideDominoCards() {
        this.dominoCards?.forEach((dominoCard) => {
            dominoCard && (dominoCard.node.active = false);
        });
    }

    async drawDominoCardsPunter() {
        await FunctionUtils.asyncExecute(this.node, this.drawDominoCardsBanker());
        await FunctionUtils.asyncExecute(this.node, this.drawDominoCardsPlayers());
    }

    async drawDominoCardsBanker() {
        const cards = this.banker?.dominoCards;
        await FunctionUtils.asyncExecute(this.node, this.drawDominoCards(cards, this.originalDominoCardBankerPosition));
    }

    async drawDominoCardsPlayers() {
        for (const [index, player] of this.players.entries()) {
            const cards = player.dominoCards;
            await FunctionUtils.asyncExecute(this.node, this.drawDominoCards(cards, this.originalDominoCardPlayersPosition[index]));
        }
    }

    protected async drawDominoCards(cards: DominoCard[], originalPositions: Vec3[]): Promise<void> {
        try {
            const drawDuration = 0.18;
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                card.node.active = true;
                card.faceDown();
                const destPosition = getPositionAtDestNode(card.node, this.nodeDominoCardBox);
                card.node.position = destPosition;
                movingNode(card.node, drawDuration, originalPositions[i]);
                this.playSound(gc.Audios.AudioIds.DRAW_SINGLE_DOMINO_CARD);
                await FunctionUtils.asyncExecute(card?.node, card.drawDominoCard(drawDuration));
            }
        } catch (error) {
            warn("An error occurred when drawDominoCards", error);
        }
    }

    async openDominoCards(result: gc.GameServiceMessage.TResult, settlementResult: gc.GameServiceMessage.TSettlementResult) {
        await FunctionUtils.asyncExecute(this.banker?.node, this.banker.handleOpenDominoCards());
        this.handleResultInfoBanker(result);

        for (let index = 0; index < this.players.length; index++) {
            const player = this.players[index];
            await FunctionUtils.asyncExecute(player?.node, player.handleOpenDominoCards());
            this.handleResultInfoPlayer(result, settlementResult, index, player);
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
