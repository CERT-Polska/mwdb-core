import { isFileDownloadAllowed } from "../../commons/hooks/fileDownloadAccess";
import { Capability } from "../../types/types";

describe("isFileDownloadAllowed", () => {
    it.each([
        { enabledByDefault: true, capabilities: [], expected: true },
        {
            enabledByDefault: false,
            capabilities: [Capability.downloadingFiles],
            expected: true,
        },
        { enabledByDefault: false, capabilities: [], expected: false },
    ])(
        "returns the effective default and capability policy",
        ({ enabledByDefault, capabilities, expected }) => {
            expect(
                isFileDownloadAllowed(
                    enabledByDefault,
                    capabilities,
                    Capability.downloadingFiles
                )
            ).toBe(expected);
        }
    );
});
