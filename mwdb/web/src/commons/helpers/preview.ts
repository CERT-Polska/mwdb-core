export type ObjectContent = string | ArrayBuffer;

function extractPrintableSequences(
    charCodes: number[],
    isPrintable: (u: number) => boolean,
    minLength: number = 4
): string {
    const result: string[] = [];
    let current: string[] = [];

    for (const c of charCodes) {
        if (isPrintable(c)) {
            current.push(String.fromCharCode(c));
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
    let charCodes: number[];
    let isPrintable: (u: number) => boolean;

    if (format === "UTF-16(LE)") {
        const buffer = getArrayBuffer(content);
        const totalChars = Math.floor(buffer.byteLength / 2);
        const chars = new Uint16Array(buffer, 0, totalChars);
        charCodes = Array.from(chars);
        isPrintable = (u) => u >= 0x20 && u <= 0x7e;
    } else {
        const buffer = new Uint8Array(getArrayBuffer(content));
        charCodes = Array.from(buffer);
        isPrintable = (u) => u >= 0x20 && u <= 0x7e;
    }

    const sequences = extractPrintableSequences(charCodes, isPrintable);
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
