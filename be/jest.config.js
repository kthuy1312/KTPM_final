module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    transform: {
        "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.jest.json" }]
    },
    moduleNameMapper: {
        "^config/(.*)$": "<rootDir>/src/config/$1",
        "^services/(.*)$": "<rootDir>/src/services/$1",
        "^controllers/(.*)$": "<rootDir>/src/controllers/$1",
        "^src/(.*)$": "<rootDir>/src/$1",
    }
};
