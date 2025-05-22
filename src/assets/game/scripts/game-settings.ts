import gc from "@sg/game-client-base";
import { LogStore } from "db://shared-components/game/scripts/stores/log-store";
import { sharedContainer } from "../../scripts/shared-container";

const GAME_NAME = "BandarQiuQiu";

export const settings = {
    id: 75,
    name: GAME_NAME,
    observerNamespace: GAME_NAME,
    durations: {
        wholeRound: 39,
        lockingBet: 3,
        placingBet: 25,
        generatingResult: 5,
        startRound: 4,
    },
    numberOfRoundHistory: 100,
};

export const containerOptions: gc.IContainerOptions = {
    globalContainer: sharedContainer,
    onContainerCreated: (container) => {
        container.bind(gc.GameConfigs.GameSetting).toConstantValue(settings);
        container.bind(LogStore).to(LogStore);
    },
};
