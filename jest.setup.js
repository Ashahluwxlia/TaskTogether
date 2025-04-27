import "@testing-library/jest-dom"
import { jest } from "@jest/globals"
import { expect } from "@jest/globals"

// Add polyfills for Node.js environment
if (typeof global.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util")
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// Add setImmediate polyfill
global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args)

// Mock the next/router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: "/",
    query: {},
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/headers
jest.mock("next/headers", () => ({
  cookies: () => ({
    get: jest.fn(() => ({ value: "mocked-cookie-value" })),
    set: jest.fn(),
  }),
  headers: () => ({
    get: jest.fn(),
  }),
}))

// Mock environment variables
process.env = {
  ...process.env,
  JWT_SECRET: "test-jwt-secret",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
}

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  }),
)

// Mock Request and Response
global.Request = class Request {
  constructor(url, options = {}) {
    this.url = url
    this.method = options.method || "GET"
    this.headers = new Headers(options.headers)
    this.body = options.body
  }
}

global.Response = class Response {
  constructor(body, options = {}) {
    this.body = body
    this.status = options.status || 200
    this.statusText = options.statusText || ""
    this.headers = new Headers(options.headers)
    this._bodyInit = body
  }

  json() {
    return Promise.resolve(JSON.parse(this._bodyInit))
  }

  text() {
    return Promise.resolve(this._bodyInit)
  }
}

// Mock Headers
global.Headers = class Headers {
  constructor(init) {
    this.headers = {}
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.headers[key.toLowerCase()] = value
      })
    }
  }

  get(name) {
    return this.headers[name.toLowerCase()]
  }

  set(name, value) {
    this.headers[name.toLowerCase()] = value
  }

  has(name) {
    return name.toLowerCase() in this.headers
  }
}

// Mock URL
global.URL.createObjectURL = jest.fn()
global.URL.revokeObjectURL = jest.fn()

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }

  observe() {
    return null
  }

  unobserve() {
    return null
  }

  disconnect() {
    return null
  }
}

// Set up global mocks if needed
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Extend expect with custom matchers if needed
expect.extend({
  // Add custom matchers here
})
