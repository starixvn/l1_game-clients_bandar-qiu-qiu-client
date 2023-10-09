import { _decorator } from "cc";
import MD5Component, { MD5Type } from "db://shared-components/game/md5/scripts/md5-component";
import Observer from "observer";
import { settings } from "../game-settings";
const { ccclass } = _decorator;

const { observer } = Observer;

export type ExtraInfos = {
    red1: boolean;
    red2: boolean;
    red3: boolean;
    red4: boolean;
};

@ccclass
@observer(settings.name)
export default class MD5 extends MD5Component {
    generateMD5Result(data: MD5Type) {
        let result = "";
        if (data.extraInfos) {
            result = data.rawValue;
        }
        if (data.hashValue) {
            result = data.hashValue;
        }

        this.lblMd5Value.string = `${result.slice(0, this.lengthOfMd5) + "..."}`;
    }

    setDataTip(data: MD5Type) {
        this.tipString = data.hashValue || data.rawValue;
    }
}
