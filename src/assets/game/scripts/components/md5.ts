import { _decorator } from "cc";
import MD5Component, { MD5Type } from "db://shared-components/game/md5/scripts/md5-component";
import Observer from "observer";
import { settings } from "../game-settings";
const { ccclass } = _decorator;

const { observer } = Observer;

@ccclass
@observer(settings.name)
export default class MD5 extends MD5Component {
    generateMD5Result(data: MD5Type) {
        let result = "";
        if (data.extraInfos) {
            const dominoes = this.generateDominoes(data.extraInfos, 12);
            result = `{${dominoes}...`;
        }
        if (data.hashValue) {
            result = `${data.hashValue.slice(0, this.lengthOfMd5)}...`;
        }

        this.lblMd5Value.string = result;
    }

    generateDominoes(extraInfos: string[], limit: number) {
        return extraInfos.reduce((result, domino, index) => {
            if (index >= limit) {
                return result;
            }
            const image = `<img src="${domino}" />`;
            result += (index + 1) % 4 === 0 && index + 1 !== limit ? `${image}, ` : `${image} `;
            return result;
        }, "");
    }

    setDataTip(data: MD5Type) {
        if (data.extraInfos && data.rawValue) {
            const dominoes = this.generateDominoes(data.extraInfos, 20);
            const suffix = data.rawValue.split("_")[1] || "";
            this.tipString = `{${dominoes.trimEnd()}}_${suffix}`;
        }
        if (data.hashValue) {
            this.tipString = data.hashValue;
        }
    }
}
