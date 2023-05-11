import {
    escapeSearchField,
    makeSearchParams,
    makeSearchLink,
    makeSearchConfigLink,
    escapeSearchValue,
    makeSearchDateLink,
    isHash,
    multiFromHashes,
    addFieldToQuery,
} from "../../commons/helpers";

describe("escapeSearchField", () => {
    test("escapes dots", () => {
        const field = "example.com";
        const expected = "example\\.com";
        const result = escapeSearchField(field);
        expect(result).toEqual(expected);
    });

    test("escapes asterisks", () => {
        const field = "a*b";
        const expected = "a\\*b";
        const result = escapeSearchField(field);
        expect(result).toEqual(expected);
    });

    test("escapes colons", () => {
        const field = "08:00:2b:01:02:03";
        const expected = "08\\:00\\:2b\\:01\\:02\\:03";
        const result = escapeSearchField(field);
        expect(result).toEqual(expected);
    });
});

describe("escapeSearchValue", () => {
    it("should return JSON.stringify if value is a typeof string", () => {
        const input = "name";
        const output = JSON.stringify(input);
        expect(escapeSearchValue(input)).toEqual(output);
    });

    it("should return string if value is a number", () => {
        const input = 123;
        const output = "123";
        expect(escapeSearchValue(input)).toEqual(output);
    });

    it("should return string if value is a array", () => {
        const input = ["name", "test"];
        const output = "name,test";
        expect(escapeSearchValue(input)).toEqual(output);
    });
});

describe("makeSearchParams", () => {
    it("should create a search params string with escaped value", () => {
        const input = { field: "foo", value: "bar", noEscape: false };
        const output = "?q=foo%3A%22bar%22";
        expect(makeSearchParams(input)).toEqual(output);
    });

    it("should create a search params string with unescaped value", () => {
        const input = { field: "foo", value: "bar", noEscape: true };
        const output = "?q=foo%3Abar";
        expect(makeSearchParams(input)).toEqual(output);
    });
});

describe("makeSearchLink", () => {
    it("should create a search link object with escaped (by default) value and pathname", () => {
        const input = {
            field: ["foo"],
            value: "bar",
            pathname: "http://google.pl",
        };
        const output = {
            pathname: "http://google.pl",
            search: "?q=foo%3A%22bar%22",
        };

        expect(makeSearchLink(input)).toEqual(output);
    });

    it("should create a search link object with unescaped value and pathname", () => {
        const input = {
            field: ["foo"],
            value: "bar",
            noEscape: true,
            pathname: "http://google.pl",
        };
        const output = {
            pathname: "http://google.pl",
            search: "?q=foo%3Abar",
        };

        expect(makeSearchLink(input)).toEqual(output);
    });

    it("should create a search link object with multiple fields", () => {
        const input = {
            field: ["foo", "test", "name"],
            value: "bar",
            noEscape: true,
            pathname: "http://google.pl",
        };
        const output = {
            pathname: "http://google.pl",
            search: "?q=foo%2Ctest%2Cname%3Abar",
        };

        expect(makeSearchLink(input)).toEqual(output);
    });
});

describe("makeSearchLink", () => {
    it("should create a search link object with escaped (by default) value and pathname", () => {
        const input = {
            field: ["foo"],
            value: "bar",
            pathname: "http://google.pl",
        };
        const output = {
            pathname: "http://google.pl",
            search: "?q=foo%3A%22bar%22",
        };

        expect(makeSearchLink(input)).toEqual(output);
    });

    it("should create a search link object with unescaped value and pathname", () => {
        const input = {
            field: ["foo"],
            value: "bar",
            noEscape: true,
            pathname: "http://google.pl",
        };
        const output = {
            pathname: "http://google.pl",
            search: "?q=foo%3Abar",
        };

        expect(makeSearchLink(input)).toEqual(output);
    });

    it("should create a search link object with multiple fields", () => {
        const input = {
            field: ["foo", "test", "name"],
            value: "bar",
            noEscape: true,
            pathname: "http://google.pl",
        };
        const output = {
            pathname: "http://google.pl",
            search: "?q=foo%2Ctest%2Cname%3Abar",
        };

        expect(makeSearchLink(input)).toEqual(output);
    });
});

describe("makeSearchConfigLink", () => {
    it("should create a search config link object with pathname by one field", () => {
        const input = {
            field: ["foo"],
            value: "bar",
            pathname: "http://google.pl",
        };
        const output = {
            pathname: "http://google.pl",
            search: "?q=cfg.foo%3A%22bar%22",
        };

        expect(makeSearchConfigLink(input)).toEqual(output);
    });

    it("should create a search config link object with pathname by many fields", () => {
        const input = {
            field: ["foo", "test", "name"],
            value: "bar",
            pathname: "http://google.pl",
        };
        const output = {
            pathname: "http://google.pl",
            search: "?q=cfg.foo.test.name%3A%22bar%22",
        };

        expect(makeSearchConfigLink(input)).toEqual(output);
    });
});

describe("makeSearchDateLink", () => {
    it("should create a search date link object with pathname and search with date without time", () => {
        const input = {
            field: ["upload_time"],
            value: "2023-03-27T09:26:20.996116+00:00",
            pathname: "http://google.pl",
        };
        const output = {
            pathname: "http://google.pl",
            search: "?q=upload_time%3A2023-03-27",
        };

        expect(makeSearchDateLink(input)).toEqual(output);
    });
});

describe("isHash", () => {
    it("returns true for valid hashes", () => {
        expect(isHash("01234567")).toBe(true); // 8 characters

        expect(isHash("0123456789abcdef0123456789abcdef")).toBe(true); // 32 characters
        expect(isHash("0123456789abcdef0123456789abcdef01234567")).toBe(true); // 40 characters
        expect(
            isHash(
                "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
            )
        ).toBe(true); // 64 characters
        expect(
            isHash(
                "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
            )
        ).toBe(true); // 128 characters
    });

    it("returns false for invalid hashes", () => {
        expect(isHash("not-a-hash")).toBe(false);
        expect(isHash("012345")).toBe(false);
        expect(isHash("0123456789abcdeg")).toBe(false);
    });
});

describe("multiFromHashes", () => {
    it("returns a multi search query if all elements are valid hashes", () => {
        const input = "01234567 0123456789abcdef0123456789abcdef";
        const expectedOutput =
            'multi:"01234567 0123456789abcdef0123456789abcdef"';
        expect(multiFromHashes(input)).toEqual(expectedOutput);
    });

    it("returns the original query if any element is not a valid hash", () => {
        const input = "01234567 not-a-hash 0123456789abcdef";
        const expectedOutput = "01234567 not-a-hash 0123456789abcdef";
        expect(multiFromHashes(input)).toEqual(expectedOutput);
    });

    it("converts all elements to lowercase", () => {
        const input = "01234567 01ABCDEF";
        const expectedOutput = 'multi:"01234567 01abcdef"';
        expect(multiFromHashes(input)).toEqual(expectedOutput);
    });
});

describe("addFieldToQuery", () => {
    it("adds a field-value pair to an empty query", () => {
        const query = addFieldToQuery("", "name", "John");
        expect(query).toBe('name:"John"');
    });

    it("adds a field-value pair to a non-empty query", () => {
        const query = addFieldToQuery("age:30", "name", "John");
        expect(query).toBe('age:30 AND name:"John"');
    });

    it('negates a field-value pair if the field starts with "NOT"', () => {
        const query = addFieldToQuery("NOT role:admin", "name", "John");
        expect(query).toBe('NOT role:admin AND name:"John"');
    });

    it('negates an existing field-value pair if the field starts with "NOT"', () => {
        const query = addFieldToQuery(
            "role:admin AND NOT name:John",
            "name",
            "Mary"
        );
        expect(query).toBe('role:admin AND NOT name:John AND name:"Mary"');
    });

    it("removes an existing field-value pair if its negation is included in the query", () => {
        const query = addFieldToQuery(
            "age:30 AND NOT name:John",
            "name",
            "Mary"
        );
        expect(query).toBe('age:30 AND NOT name:John AND name:"Mary"');
    });
});
