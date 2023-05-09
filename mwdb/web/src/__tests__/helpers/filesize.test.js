import { humanFileSize } from "../../commons/helpers";

describe("humanFileSize", () => {
    it("returns the correct string representation for a given size in bytes", () => {
        expect(humanFileSize(0)).toBe("0 Bytes");
        expect(humanFileSize(64)).toBe("64 Bytes");
        expect(humanFileSize(1023)).toBe("1023 Bytes");
        expect(humanFileSize(1024)).toBe("1 kB");
        expect(humanFileSize(4096)).toBe("4 kB");
        expect(humanFileSize(1048576)).toBe("1 MB");
        expect(humanFileSize(1099511627776)).toBe("1 TB");
        expect(humanFileSize(10995116277760)).toBe("10 TB");
    });
});
