/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  clearMocks: true,
  moduleNameMapper: {
    '^isomorphic-dompurify$': '<rootDir>/src/__mocks__/isomorphic-dompurify.ts',
  },
};
