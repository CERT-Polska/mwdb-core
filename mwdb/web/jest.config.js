module.exports = {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    transform: {
        "^.+\\.(js|jsx|ts|tsx)$": "ts-jest",
    },
    testMatch: [
        "<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}",
        "<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}",
    ],
    moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
    moduleNameMapper: {
        "^@mwdb-web/commons/(.*)$": "<rootDir>/src/commons/$1",
        "^@mwdb-web/plugins$": "<rootDir>/src/mocks/plugins.ts",
    },
    resetMocks: true,
};
