module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/tests/**/*.test.ts'],
  collectCoverageFrom: ['lib/**/*.ts'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  verbose: true,
};
