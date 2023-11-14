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
    private readonly originalDominoCardPlayersPosition: Vec3[] = [];
    private systemType = Configs.SystemConfigs.SG.name;

    playSoundDrawDominoCard = () => {};

    onLoad(): void {
        super.onLoad();
        const processDominoCards = (cards: DominoCard[], positionArray: Vec3[]) => {
            cards?.forEach((dominoCard) => {
                if (dominoCard) {
                    dominoCard.setBackDominoCardSystem(this?.systemType);
                    this.dominoCards.push(dominoCard);
                    positionArray.push(new Vec3(dominoCard.node.position));
                }
            });
        };

        processDominoCards(this.banker?.dominoCards, this.originalDominoCardBankerPosition);

        this.players.forEach((player) => {
            processDominoCards(player?.dominoCards, this.originalDominoCardPlayersPosition);
        });
    }

    hideDominoCards() {
        this.dominoCards?.forEach((dominoCard) => {
            dominoCard && (dominoCard.node.active = false);
        });
    }

    async drawDominoCardsPunter() {
        await this.drawDominoCardsBanker();
        await this.drawDominoCardsPlayers();
    }

    async drawDominoCardsBanker() {
        const cards = this.banker?.dominoCards;
        await this.drawDominoCards(cards, this.originalDominoCardBankerPosition);
    }

    async drawDominoCardsPlayers() {
        for (const player of this.players) {
            const cards = player.dominoCards;
            await this.drawDominoCards(cards, this.originalDominoCardPlayersPosition);
        }
    }

    async drawDominoCards(cards: DominoCard[], originalPositions: Vec3[]): Promise<void> {
        const pullDuration = 0.1;
        const drawDuration = 0.4;

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            card.node.active = true;
            card.faceDown();
            const destPosition = getPositionAtDestNode(card.node, this.nodeDominoCardBox);
            card.node.position = destPosition;

            await card.pullDominoCard(pullDuration);
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
