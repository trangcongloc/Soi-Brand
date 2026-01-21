import "@testing-library/jest-dom";

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock fetch
global.fetch = jest.fn();

// Mock Next.js Request/Response/Headers for API route testing
class MockRequest {
    constructor(public url: string, public init?: any) {}
    headers = new Map();
    json = jest.fn();
}

class MockResponse {
    constructor(public body?: any, public init?: any) {}
    headers = new Map();
}

class MockHeaders extends Map {}

global.Request = MockRequest as any;
global.Response = MockResponse as any;
global.Headers = MockHeaders as any;

// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
});
