import gc from "@sg/game-client-base";
import { Node, Vec3, _decorator } from "cc";
import { DominoCard } from "db://shared-components/game/domino/scripts/domino-card";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { DominoCards } from "./domino-cards";
const { ccclass, property } = _decorator;

const { Configs } = gc;
const { movingNode, getPositionAtDestNode } = AnimationUtils;
const { render } = Observer;

type OriginalDominoCardPlayersPosition = {
    [playerIndex: number]: Vec3[];
};

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

    playSoundDrawDominoCard = () => {};

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
        console.time("-------drawDomino----------------");
        await this.drawDominoCardsBanker();
        await this.drawDominoCardsPlayers();

        console.timeEnd("-------drawDomino----------------");
    }

    async drawDominoCardsBanker() {
        const cards = this.banker?.dominoCards;
        await this.drawDominoCards(cards, this.originalDominoCardBankerPosition);
    }

    async drawDominoCardsPlayers() {
        for (const [index, player] of this.players.entries()) {
            const cards = player.dominoCards;

            await this.drawDominoCards(cards, this.originalDominoCardPlayersPosition[index]);
        }
    }

    async drawDominoCards(cards: DominoCard[], originalPositions: Vec3[]): Promise<void> {
        const drawDuration = 0.18;

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            card.node.active = true;
            card.faceDown();
            const destPosition = getPositionAtDestNode(card.node, this.nodeDominoCardBox);
            card.node.position = destPosition;

            movingNode(card.node, drawDuration, originalPositions[i]);
            this.playSoundDrawDominoCard();
            await card.drawDominoCard(drawDuration);
        }
    }

    async openDominoCards() {
        await this.banker.handleOpenDominoCards();
        for (const player of this.players) {
            await player.handleOpenDominoCards();
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
}
