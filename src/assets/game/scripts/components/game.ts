import gc from "@sg/game-client-base";
import { Label, Node, Vec3, _decorator, sp, tween, WebView ,UITransform } from "cc";
import { PokerCard, ServiceCard } from "db://shared-components/game/poker-cards/scripts/poker-card";
import GameComponent from "db://shared-components/game/scripts/components/game-component";
import { WinningResult } from "db://shared-components/shared/common-components/winning-result/scripts/winning-result";
import { startGame } from "db://shared-components/shared/scripts/startup";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { siteConfigs } from "../../../scripts/site-configs";
import { containerOptions, settings } from "../game-settings";
import "./../../../resources/i18n";
import { BetChoice, Choice } from "./dtf-commons";
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

    @property(PokerCard)
    cards: PokerCard[] = [];

    @property(Node)
    nodeCardBox: Node = null;

    @property({ type: sp.Skeleton })
    resultSpines: sp.Skeleton[] = [];

    @property({ type: Node })
    staticMonsters: Node[] = [];

    @property(WinningResult)
    winningResult: WinningResult = null;

    @property(Node)
    miniGamesContainer: Node = null;

    openedGameIndex = 0;

    override namespace = settings.name;
    override containerOptions = containerOptions;

    private originalCardPosition: Vec3[] = [];
    private choiceWinningSounds = {
        dragon: "dragon-growl",
        tiger: "tiger-growl",
    };

    onLoad() {
        super.onLoad();
        this.initResultSpines();
        this.cards.forEach((card) => this.originalCardPosition.push(new Vec3(card.node.position)));
        this.winningResult.hideQuickly();
    }

    randomnumber(min, max){
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    openMiniGame(){
        const baseGameIds = [1,3,4,6,7,9,45,50];
        if(this.openedGameIndex < 4 ){
            console.log("mini games: ", this.miniGamesContainer.children.length);
            const session = btoa(JSON.stringify(gc.StorageManager.get(gc.localStorageKeys.session)));
            const baseUrl = `http://localhost:7456/?mode=minigame&session=${session}`;
            
            const gameIds = [baseGameIds[this.openedGameIndex]];        
            this.openedGameIndex += 1;
            gameIds.forEach((id) => {
                
                const newNode = new Node();
                newNode.addComponent(WebView);
                this.miniGamesContainer.insertChild(newNode, this.miniGamesContainer.children.length);            
                const minigame1 = newNode.getComponent(WebView);
                const url = `${baseUrl}&gameId=${id}`;
                minigame1.url = url;             
                minigame1.node.addComponent(UITransform);
                const uiTransform = minigame1.node.getComponent(UITransform);
                uiTransform.width = 600;
                uiTransform.height = 400;
                //newNode.position = new Vec3(100*random, 50*random, 0);            
            })
        }
    }

    removeMiniGame(){
        this.miniGamesContainer.removeAllChildren();
    }

    async finishShowResult(result: gc.GameServiceMessage.TResult, settlementResult: gc.GameServiceMessage.TSettlementResult) {
        await this.showResultSpines(settlementResult);
        const winChoice = this.winningResult.setSettlementResult(settlementResult);
        !!winChoice && this.playSound(this.getAudioKeyChoiceWinning(winChoice));
        await this.winningResult.show();
        const resultSpineDuration = 1.67;
        const showWinningResult = 1 + (settlementResult[BetChoice.Tie] ? resultSpineDuration : 0);
        await AnimationUtils.delayTime(showWinningResult);
        this.winningResult.hide();
        super.finishShowResult(result, settlementResult);
    }

    async showResult(result: gc.GameServiceMessage.TResult, hasAnimation: boolean) {
        if (result) {
            this.renderResultCards(result);

            if (hasAnimation) {
                await this.openCards();
            } else {
                this.openCardsWithoutAnim();
            }
        }
    }

    private initResultSpines() {
        this.resultSpines.forEach((spine) => {
            spine.node.active = false;
        });
    }

    private async showResultSpines(settlementResult: gc.GameServiceMessage.TSettlementResult) {
        const winChoice = Object.keys(settlementResult).find((choice) => settlementResult[choice]);
        if (winChoice === BetChoice.Tie) {
            return;
        }
        const spine = this.resultSpines.find((spine) => spine.node.name === winChoice);
        const staticImage = this.staticMonsters.find((staticMonster) => staticMonster.name === winChoice);
        if (spine) {
            fadeOut(staticImage, 0.2);
            spine.node.active = true;
            this.playSound(this.choiceWinningSounds[winChoice]);
            const animationName = winChoice;
            const duration = spine.findAnimation(animationName).duration;
            const hidingDuration = 0.2;
            const scaleNode = spine.node.parent;
            const originalScale = new Vec3(scaleNode.scale);
            tween(scaleNode)
                .delay(duration - hidingDuration)
                .call(() => {
                    fadeIn(staticImage, hidingDuration);
                })
                .to(hidingDuration, { scale: Vec3.ONE })
                .start();
            await playSpine(spine, animationName);
            spine.node.active = false;
            scaleNode.scale = originalScale;
        }
    }

    private getAudioKeyChoiceWinning(name: string): string {
        return `${name.toLowerCase()}_${Translator.getLanguageId() || "en"}`;
    }

    async handleStartRound(isStartRound: boolean) {
        if (isStartRound) {
            super.handleStartRound(isStartRound);

            this.hideCards();
            await this.drawCards();
        }
    }

    async drawCards() {
        const cards = this.cards;
        const pullDuration = 0.1;
        const drawDuration = 0.4;

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            card.node.active = true;
            card.faceDown();
            const destPosition = getPositionAtDestNode(card.node, this.nodeCardBox);
            card.node.position = destPosition;
            await card.pullCard(pullDuration);
            movingNode(card.node, drawDuration, this.originalCardPosition[i]);
            this.playSound(gc.Audios.AudioIds.DRAW_SINGLE_CARD);
            await card.drawCard(drawDuration);
        }
    }

    async hideCards() {
        const cards = this.cards;
        for (const card of cards) {
            card.node.active = false;
        }
    }

    private renderResultCards(result: gc.GameServiceMessage.TResult) {
        this.cards[Choice.Dragon].setServiceCard(result[BetChoice.Dragon] as ServiceCard);
        this.cards[Choice.Tiger].setServiceCard(result[BetChoice.Tiger] as ServiceCard);
    }

    private async openCards() {
        await this.cards[Choice.Dragon].openCard();
        await this.cards[Choice.Tiger].openCard();
    }

    private openCardsWithoutAnim() {
        this.cards[Choice.Dragon].faceUp();
        this.cards[Choice.Tiger].faceUp();
    }
}
