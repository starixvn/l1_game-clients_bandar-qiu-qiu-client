import gc from "@sg/game-client-base";
import { Label, Node, Vec3, _decorator, sp, tween, WebView ,UITransform, EventTarget, v3, director  } from "cc";
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
const { Settlements, Rounds, Translator, BrowserDomUtils } = gc;

const { movingNode, getPositionAtDestNode, playSpine, fadeOut, fadeIn } = AnimationUtils;

startGame(settings.name, containerOptions, siteConfigs);

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

const eventTarget = new EventTarget();

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

    @property(Node)
    minigame: Node = null;

    openedGameIndex = 0;

    changedX: number = 0;
    changedY: number = 0;

    startedX: number = 0;
    startedY: number = 0;

    previousMovedX = 0;
    previousMovedY = 0;

    containerStartedX: number = 0;
    containerStartedY: number = 0;

    eliminateInvalidX = 0;
    eliminateInvalidY = 0;

    movedArray = [];

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

        window.addEventListener('message', e => {
            const message = JSON.parse(e['data']);
            if(message.type === "MOUSE_MOVE"){
                eventTarget.emit("MOUSE_MOVE", e['data']);
            }
            else if(message.type === "MOUSE_DOWN"){
                eventTarget.emit("MOUSE_DOWN", e['data']);
            }
            else if(message.type === "MOUSE_UP"){
                eventTarget.emit("MOUSE_UP", e['data']);
            }
        },false);        

        eventTarget.on("close-game", (data) => {
            this.closeMiniGame();
        })

        eventTarget.on("touch-end", (data) => {
            //this.resizeIframe(false);
            console.log("touch end");
            this.resetMoving();
        })

        eventTarget.on("move", (data) => {
            this.move(data);
        })

        eventTarget.on("MOUSE_MOVE", (data) => {            
            if(this.startedX !== 0 && this.startedY !== 0){
                const message = JSON.parse(data);
                const currentPositionX = this.miniGamesContainer.position.x + message.data.x;
                const currentPositionY = this.miniGamesContainer.position.y + message.data.y;
                const movedX = currentPositionX - this.startedX;
                const movedY = currentPositionY - this.startedY;
                
                let validMovedX = (this.previousMovedX > 0 && movedX >= this.previousMovedX) || (this.previousMovedX < 0 && movedX <= this.previousMovedX) || this.previousMovedX === 0;
                let validMovedY = (this.previousMovedY > 0 && movedY >= this.previousMovedY) || (this.previousMovedY < 0 && movedY <= this.previousMovedY) || this.previousMovedY === 0;
                if(!validMovedX){
                    this.eliminateInvalidX += 1;
                }
                if(!validMovedY){
                    this.eliminateInvalidY += 1;
                }

                if((validMovedX || this.eliminateInvalidX > 2) && (validMovedY || this.eliminateInvalidY > 2)){
                    //console.log("MOUSE_MOVE", currentPositionX, currentPositionY, movedX, movedY);
                    this.eliminateInvalidX = 0;
                    this.eliminateInvalidY = 0;
                    this.previousMovedX = movedX;
                    this.previousMovedY = movedY;
                    this.miniGamesContainer.position = v3(this.containerStartedX + movedX, this.containerStartedY + movedY, this.miniGamesContainer.position.z);
                }
                else{
                    console.log("invalid move ", movedX, movedY, this.previousMovedX, this.previousMovedY, this.eliminateInvalidX, this.eliminateInvalidY);
                }
            }
        })

        eventTarget.on("MOUSE_UP", (data) => {
            this.resetMove();
            console.log("MOUSE_UP", this.startedX, this.startedY);
        })

        eventTarget.on("MOUSE_DOWN", (data) => {
            this.previousMovedX = 0;
            this.previousMovedY = 0;
            this.containerStartedX = this.miniGamesContainer.position.x;
            this.containerStartedY = this.miniGamesContainer.position.y;
            this.eliminateInvalidX = 0;
            this.eliminateInvalidY = 0;
            
            const message = JSON.parse(data);
            this.startedX = this.miniGamesContainer.position.x + message.data.x;
            this.startedY = this.miniGamesContainer.position.y + message.data.y;
            
            console.log("MOUSE_DOWN", this.startedX, this.startedY);
        })

        this.openMiniGame();

        setTimeout(() => {

        }, 10000);

        this.node.on(Node.EventType.MOUSE_MOVE, () => {
            if(this.isMoving()){
                window.postMessage("resetMoving", "*");
            }
            console.log("mouse move");
            //this.resetMoving();
            this.resetMove();
        }, this);
    }

    resetMove(){
        this.previousMovedX = 0;
        this.previousMovedY = 0;
        this.containerStartedX = this.miniGamesContainer.position.x;
        this.containerStartedY = this.miniGamesContainer.position.y;
        this.startedX = 0;
        this.startedY = 0;
        this.eliminateInvalidX = 0;
        this.eliminateInvalidY = 0;
    }

    isMoving(){
        return this.changedX !== 0 || this.changedY !== 0;
    }

    resetMoving(){
        if(this.isMoving()){
            this.changedX = 0;
            this.changedY = 0;
        }
    }

    randomnumber(min, max){
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    isPositionInRange(){
        const canvas = director.getScene().getChildByName("Canvas");
        const uiTransform = canvas.getComponent(UITransform);

        const maxX = uiTransform.width/2 - 700/2;
        const maxY = uiTransform.height/2 - 500/2;

        const cannotMoveX = (this.miniGamesContainer.position.x > maxX && this.changedX > 0)  || this.miniGamesContainer.position.x < -maxX && this.changedX < 0;
        const cannotMoveY = (this.miniGamesContainer.position.y > maxY && this.changedY > 0)  || this.miniGamesContainer.position.y < -maxY && this.changedY < 0;

        console.log("cannotMoveX ", cannotMoveX, "cannotMoveY", cannotMoveY);
        return !cannotMoveX && !cannotMoveY;        
    }

    move(data){
        if(!this.isMoving()){
            const changed = JSON.parse(data);
            this.changedX = changed.x > 20 ? 20 : changed.x;
            this.changedY = changed.y > 20 ? 20 : changed.y;
            console.log("update move ", JSON.parse(data));        
        }
       // console.log("apply move ", this.miniGamesContainer.position.x, this.miniGamesContainer.position.y);
        
        if(this.isPositionInRange()){
            this.miniGamesContainer.position = v3(this.miniGamesContainer.position.x + this.changedX, this.miniGamesContainer.position.y + this.changedY, this.miniGamesContainer.position.z);
        }
        else{
            this.resetMoving();
        }
    }

    moveIframe(){
        const canvas = director.getScene().getChildByName("Canvas");
        const uiTransform = canvas.getComponent(UITransform);
        console.log("canvas size ", uiTransform.width, uiTransform.height);

        const webViewUiTransform = this.miniGamesContainer.getComponent(UITransform);
        console.log("web view size ", webViewUiTransform.width, webViewUiTransform.height, this.miniGamesContainer.position);
        this.miniGamesContainer.position = v3(0, 300, 0);
    }
    
    resizeIframe(isFullScreen: boolean){
        console.log("resize ", isFullScreen);
        const canvas = director.getScene().getChildByName("Canvas");
        const uiTransform = canvas.getComponent(UITransform);
        console.log("canvas size ", uiTransform.width, uiTransform.height);

        const webviewNode = this.miniGamesContainer.children[0].getComponent(WebView);
        console.log("webviewNode", webviewNode);
        const webViewUiTransform = webviewNode.getComponent(UITransform);
        console.log("web view size ", webViewUiTransform.width, webViewUiTransform.height);

        if(isFullScreen){
            //webviewNode.setScale(v3(webViewUiTransform.width/uiTransform.width, webViewUiTransform.height/uiTransform.height, 1));
            webViewUiTransform.width = uiTransform.width;
            webViewUiTransform.height = uiTransform.height;
        }
        else{
               //webViewUiTransform.width = 700;
                //webViewUiTransform.height = 700;
            
            
        }
    }

    openMiniGame(){
        const baseGameIds = [1,3,4,6,7,9,45,50];
        if(this.openedGameIndex < 1 ){
            const session = btoa(JSON.stringify(gc.StorageManager.get(gc.localStorageKeys.session)));
            //const baseUrl = `https://l1-games3.lumigame.com/?mode=minigame&session=${session}`; //`http://localhost:7456/?mode=minigame&session=${session}`;
            const baseUrl = `http://localhost:7456/?mode=minigame&session=${session}`;
            
            
            const gameIds = [baseGameIds[this.openedGameIndex]];        
            this.openedGameIndex += 1;
            gameIds.forEach((id) => {
                
                const newNode = new Node();
                newNode.addComponent(WebView);
                this.miniGamesContainer.insertChild(newNode, 0);// this.miniGamesContainer.children.length);            
                const minigame1 = newNode.getComponent(WebView);
                const url = `${baseUrl}&gameId=${id}`;
                console.log(url);
                minigame1.url = url;             
                minigame1.node.addComponent(UITransform);
                const uiTransform = minigame1.node.getComponent(UITransform);
                uiTransform.width = 750;
                uiTransform.height = 700;
                //newNode.position = new Vec3(100*random, 50*random, 0);            
            })
        }
        this.miniGamesContainer.active = true;
    }

    closeMiniGame(){
        this.minigame.removeAllChildren();
        this.miniGamesContainer.active = false;
        this.openedGameIndex = 0;
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
