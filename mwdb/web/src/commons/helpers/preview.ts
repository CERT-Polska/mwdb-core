export type ObjectContent = string | ArrayBuffer;

function extractPrintableSequences(
    units: number[],
    isPrintable: (u: number) => boolean,
    minLength: number = 4
): string {
    const result: string[] = [];
    let current: string[] = [];

    for (const u of units) {
        if (isPrintable(u)) {
            current.push(String.fromCharCode(u));
        } else {
            if (current.length >= minLength) result.push(current.join(""));
            current = [];
        }
    }
    if (current.length >= minLength) result.push(current.join(""));

    return result.join("\n");
}

function getArrayBuffer(content: ObjectContent): ArrayBuffer {
    return content instanceof ArrayBuffer
        ? content
        : new TextEncoder().encode(content).buffer;
}

export function formatRaw(content: ObjectContent): string {
    if (content instanceof ArrayBuffer)
        return new TextDecoder().decode(content);
    return content;
}

export function formatPrintable(
    content: ObjectContent,
    format: "UTF-8" | "UTF-16(LE)"
): string {
    let units: number[];
    let isPrintable: (u: number) => boolean;

    if (format === "UTF-16(LE)") {
        const buffer = getArrayBuffer(content);
        const totalUnits = Math.floor(buffer.byteLength / 2);
        const chars = new Uint16Array(buffer, 0, totalUnits);
        units = Array.from(chars);
        isPrintable = (u) => u >= 0x20 && u <= 0x7e;
    } else {
        const buffer = new Uint8Array(getArrayBuffer(content));
        units = Array.from(buffer);
        isPrintable = (u) => u >= 0x20 && u <= 0x7e;
    }

    const sequences = extractPrintableSequences(units, isPrintable);
    if (!sequences) {
        return "";
    }
    return sequences;
}

export function formatHex(content: ObjectContent): string {
    const bytes = new Uint8Array(getArrayBuffer(content));

    const rows: string[] = [];
    let byteRow: string[] = [];
    let asciiRow: string[] = [];

    for (let idx = 0; idx < bytes.length; idx++) {
        if (idx && idx % 16 === 0) {
            rows.push(byteRow.join(" ").padEnd(50, " ") + asciiRow.join(""));
            byteRow = [];
            asciiRow = [];
        }
        byteRow.push(bytes[idx].toString(16).padStart(2, "0"));
        asciiRow.push(
            bytes[idx] >= 0x20 && bytes[idx] <= 0x7e
                ? String.fromCharCode(bytes[idx])
                : "."
        );
    }

    if (byteRow.length > 0) {
        rows.push(byteRow.join(" ").padEnd(50, " ") + asciiRow.join(""));
    }

    return rows.join("\n");
}
