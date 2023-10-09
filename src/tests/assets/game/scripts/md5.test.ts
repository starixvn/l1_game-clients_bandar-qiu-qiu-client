jest.mock("./../../../../assets/game/scripts/game-settings", () => ({
    settings: {
        id: 67,
        name: "DragonTigerFight",
    },
}));

jest.mock("@sg/game-client-base", () => {
    const originalModule = jest.requireActual("@sg/game-client-base");

    //Mock the default export and named export 'foo'
    return {
        ...originalModule,
        Translator: {
            commonTranslate: () => jest.fn(),
        },
    };
});

jest.mock("observer", () => {
    const originalModule = jest.requireActual("observer");

    //Mock the default export and named export 'foo'
    return {
        ...originalModule,
        observer: (target?: any) => {
            if (typeof target === "string") {
                return (x: unknown) => x;
            }

            return target;
        },
    };
});

import EffectAppearanceLabel from "db://shared-components/game/md5/scripts/effect-appearance-label";
import MD5 from "../../../../assets/game/scripts/components/md5";
import { MD5Type } from "db://shared-components/game/md5/scripts/md5-component";
import { Label } from "../../../cocos-testing/cc/label";
import { Node } from "../../../cocos-testing/cc/node";
import { Mask } from "../../../cocos-testing/cc/mask";

import { mockDeep, DeepMockProxy } from "jest-mock-extended";

describe("MD5 tests", () => {
    let md5Instance: MD5;

    beforeEach(() => {
        md5Instance = new MD5();
    });

    afterEach(() => {
        md5Instance = null;
    });

    it("should load component successfully", () => {
        // Arrange
        const md5Component = new MD5();
        const nodeHintCopyMock = mockDeep<Node>();
        nodeHintCopyMock.getChildByName.mockReturnValue(new Node());
        md5Component.nodeHintCopy = nodeHintCopyMock;
        md5Component.lblCaption = mockDeep<Label>();

        // Act
        md5Component.onLoad();

        // Assert
        expect(md5Component).toBeDefined();
    });

    it("should correctly generate MD5 result", () => {
        // Arrange
        const testData: MD5Type = {
            extraInfos: false, // Replace with your test data
            rawValue: "testRawValue", // Replace with your test data
            hashValue: "testHashValue", // Replace with your test data
        };
        md5Instance.lblMd5Value = new EffectAppearanceLabel();
        md5Instance.lblMd5Value.label = new Label();
        md5Instance.lblMd5Value.mask = new Mask();

        // Act
        md5Instance.generateMD5Result(testData);

        // Assert that the lblMd5Value.string property has been set correctly
        expect(md5Instance.lblMd5Value.string).toBe("testHashValue...");
    });
});
