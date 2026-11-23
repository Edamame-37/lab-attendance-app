module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
  collectCoverageFrom: [
    'src/services/locationService.js',
    'src/context/AuthContext.js',
    'src/services/firestoreService.js',
  ],
};
