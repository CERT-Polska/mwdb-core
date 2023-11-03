import { GenericOrJSX } from "@mwdb-web/types/types";
import {
    capitalize,
    intersperse,
    mapObjectType,
    negateBuffer,
} from "../../commons/helpers";

describe("capitalize", () => {
    test("should return empty string when param is not typeof string", () => {
        const string = {};
        const expected = "";
        const result = capitalize(string as string);
        expect(result).toEqual(expected);
    });

    test("should return capitalize first letter of string", () => {
        const string = "tom";
        const expected = "Tom";
        const result = capitalize(string);
        expect(result).toEqual(expected);
    });

    test("should return the same string if first letter is already capitalize", () => {
        const string = "John";
        const expected = "John";
        const result = capitalize(string);
        expect(result).toEqual(expected);
    });
});

describe("intersperse", () => {
    test("should return an empty array when passed an empty array", () => {
        const expected: GenericOrJSX<string>[] = [];
        const result = intersperse([], "-");
        expect(result).toEqual(expected);
    });

    it("should intersperse a single item in an array", () => {
        const expected = ["1", "-", "2", "-", "3"];
        const result = intersperse(["1", "2", "3"], "-");
        expect(result).toEqual(expected);
    });

    it("should intersperse multiple items in an array", () => {
        const expected = ["1", "-", ".", "2", "-", ".", "3"];
        const result = intersperse(["1", "2", "3"], ["-", "."]);
        expect(expected).toEqual(result);
    });

    it("should intersperse a single JSX item in an array", () => {
        const expected = [1, <br />, 2, <br />, 3];
        const result = intersperse([1, 2, 3], <br />);
        expect(expected).toEqual(result);
    });

    it("should intersperse a multiple JSX items in an array", () => {
        const expected = [1, <br />, <div />, 2, <br />, <div />, 3];
        const result = intersperse([1, 2, 3], [<br />, <div />]);
        expect(expected).toEqual(result);
    });
});

describe("mapObjectType", () => {
    it("should return 'object' when passed 'object'", () => {
        const result = mapObjectType("object");
        expect(result).toBe("object");
    });

    it("should return 'file' when passed 'file'", () => {
        const result = mapObjectType("file");
        expect(result).toBe("file");
    });

    it("should return 'config' when passed 'static_config'", () => {
        const result = mapObjectType("static_config");
        expect(result).toBe("config");
    });

    it("should return 'blob' when passed 'text_blob'", () => {
        const result = mapObjectType("text_blob");
        expect(result).toBe("blob");
    });

    it("should return the input string if it does not match any of the predefined values", () => {
        const result = mapObjectType("unknown");
        expect(result).toBe("unknown");
    });
});

describe("negateBuffer", () => {
    it("should negate the buffer contents correctly", () => {
        const buffer = new ArrayBuffer(4);
        const view = new Uint8Array(buffer);
        view[0] = 0x11;
        view[1] = 0x22;
        view[2] = 0x33;
        view[3] = 0x44;

        const result = negateBuffer(buffer);
        const resultView = new Uint8Array(result);
        expect(resultView[0]).toBe(0xee);
        expect(resultView[1]).toBe(0xdd);
        expect(resultView[2]).toBe(0xcc);
        expect(resultView[3]).toBe(0xbb);
    });

    it("should return a new buffer", () => {
        const buffer = new ArrayBuffer(4);
        const result = negateBuffer(buffer);

        expect(result).not.toBe(buffer);
        expect(result).toBeInstanceOf(ArrayBuffer);
    });
});
