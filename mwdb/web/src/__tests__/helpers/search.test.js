import {
    escapeSearchField,
    makeSearchParams,
    makeSearchLink,
    makeSearchConfigLink,
    escapeSearchValue,
} from "../../commons/helpers/search";

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
