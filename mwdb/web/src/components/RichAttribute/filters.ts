export type JSONValue = 
 | string
 | number
 | boolean
 | null

export type filter = {
    name: string,
    action: (value: JSONValue) => JSONValue,
}

export const filters: filter[] = [
    {
        name: "upper",
        action: (value: JSONValue) => {
            if (typeof value === "string") {
                return value.toUpperCase();
            }
            return value;
        }
    }
];