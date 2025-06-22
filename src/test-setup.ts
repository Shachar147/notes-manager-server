// src/test-setup.ts
// Suppress console.error messages during tests
jest.spyOn(console, 'error').mockImplementation(() => {}); 