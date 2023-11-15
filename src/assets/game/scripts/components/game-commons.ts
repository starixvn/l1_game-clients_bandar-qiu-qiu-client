export enum BetChoice {
    Spade = "spade",
    Heart = "heart",
    Club = "club",
    Diamond = "diamond",
}

export const handRankingIdMapText = {
    5: "six_devil",
    4: "twin",
    3: "small",
    2: "big",
    1: "qiuqiu",
    0: "ordinary",
};

export interface TResult {
    banker: IResultInfo;
    spade: IResultInfo;
    heart: IResultInfo;
    club: IResultInfo;
    diamond: IResultInfo;
}

export interface IResultInfo {
    dominoes: number[];
    handRankingId: number;
    pipsOfSet: number[];
}

export const resultStatus = {
    Lose: 0,
    Win: 1,
    Tie: 2,
};

export const resultStatusColorMapping = {
    [resultStatus.Lose]: "#bfbfbf",
    [resultStatus.Win]: "#fffc00",
    [resultStatus.Tie]: "#00f11c",
};
