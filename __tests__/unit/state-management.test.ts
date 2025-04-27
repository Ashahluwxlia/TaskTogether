import { describe, it, expect, jest } from "@jest/globals"

describe("Advanced State Management Patterns", () => {
  interface Action<T = any> {
    type: string
    payload?: T
  }

  type Reducer<S> = (state: S, action: Action) => S

  type Middleware<S> = (store: Store<S>) => (next: (action: Action) => any) => (action: Action) => any

  class Store<S> {
    private state: S
    private reducer: Reducer<S>
    private listeners: Array<() => void> = []
    private middlewares: Array<(action: Action) => Action> = []

    constructor(reducer: Reducer<S>, initialState: S) {
      this.reducer = reducer
      this.state = initialState
    }

    getState(): S {
      return this.state
    }

    dispatch(action: Action): Action {
      let processedAction = action

      // Apply middlewares
      for (const middleware of this.middlewares) {
        processedAction = middleware(processedAction)
      }

      this.state = this.reducer(this.state, processedAction)
      this.listeners.forEach((listener) => listener())

      return processedAction
    }

    subscribe(listener: () => void): () => void {
      this.listeners.push(listener)
      return () => {
        this.listeners = this.listeners.filter((l) => l !== listener)
      }
    }

    applyMiddleware(...middlewares: Array<Middleware<S>>): void {
      this.middlewares = middlewares.map((middleware) => {
        const store = {
          getState: this.getState.bind(this),
          dispatch: (action: Action) => this.dispatch(action),
        }
        return middleware(store as Store<S>)((action) => action)
      })
    }
  }

  it("should manage state through actions and reducers", () => {
    // Define a simple counter reducer
    interface CounterState {
      count: number
    }

    const initialState: CounterState = { count: 0 }

    const counterReducer: Reducer<CounterState> = (state, action) => {
      switch (action.type) {
        case "INCREMENT":
          return { ...state, count: state.count + 1 }
        case "DECREMENT":
          return { ...state, count: state.count - 1 }
        case "ADD":
          return { ...state, count: state.count + (action.payload || 0) }
        default:
          return state
      }
    }

    // Create store
    const store = new Store(counterReducer, initialState)

    // Test initial state
    expect(store.getState()).toEqual({ count: 0 })

    // Test actions
    store.dispatch({ type: "INCREMENT" })
    expect(store.getState()).toEqual({ count: 1 })

    store.dispatch({ type: "ADD", payload: 5 })
    expect(store.getState()).toEqual({ count: 6 })

    store.dispatch({ type: "DECREMENT" })
    expect(store.getState()).toEqual({ count: 5 })
  })

  it("should notify subscribers when state changes", () => {
    // Simple reducer
    const reducer: Reducer<number> = (state, action) => {
      if (action.type === "SET") return action.payload || 0
      return state
    }

    const store = new Store(reducer, 0)

    // Create a mock listener
    const listener = jest.fn()

    // Subscribe to store changes
    const unsubscribe = store.subscribe(listener)

    // Dispatch actions
    store.dispatch({ type: "SET", payload: 10 })
    store.dispatch({ type: "SET", payload: 20 })

    // Verify listener was called
    expect(listener).toHaveBeenCalledTimes(2)

    // Unsubscribe
    unsubscribe()

    // Dispatch another action
    store.dispatch({ type: "SET", payload: 30 })

    // Verify listener wasn't called again
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it("should apply middleware to process actions", () => {
    // Simple reducer
    const reducer: Reducer<number> = (state, action) => {
      if (action.type === "ADD") return state + (action.payload || 0)
      return state
    }

    const store = new Store(reducer, 0)

    // Create a logging middleware
    const loggingMiddleware: Middleware<number> = (store) => (next) => (action) => {
      // This would normally log, but we'll just spy on it
      const spy = jest.fn()
      spy(action)

      return next(action)
    }

    // Create a doubling middleware
    const doublingMiddleware: Middleware<number> = (store) => (next) => (action) => {
      if (action.type === "ADD") {
        return next({
          ...action,
          payload: (action.payload || 0) * 2,
        })
      }
      return next(action)
    }

    // Apply middlewares
    store.applyMiddleware(loggingMiddleware, doublingMiddleware)

    // Dispatch an action
    store.dispatch({ type: "ADD", payload: 5 })

    // The doubling middleware should double the payload
    expect(store.getState()).toBe(10)
  })
})
