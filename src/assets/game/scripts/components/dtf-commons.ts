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
