import { renderHook, act } from "@testing-library/react"
import { useAsync } from "@/hooks/use-async"

describe("useAsync hook", () => {
  test("should initialize with default values", async () => {
    const asyncFn = jest.fn().mockResolvedValue("result")

    const { result } = renderHook(() => useAsync(asyncFn))

    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  test("should execute async function and update state", async () => {
    const asyncFn = jest.fn().mockResolvedValue("result")

    const { result } = renderHook(() => useAsync(asyncFn))

    await act(async () => {
      await result.current.execute()
    })

    expect(asyncFn).toHaveBeenCalled()
    expect(result.current.data).toBe("result")
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  test("should handle errors", async () => {
    const error = new Error("Test error")
    const asyncFn = jest.fn().mockRejectedValue(error)

    const { result } = renderHook(() => useAsync(asyncFn))

    await act(async () => {
      await result.current.execute()
    })

    expect(asyncFn).toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBe(error)
    expect(result.current.loading).toBe(false)
  })

  test("should execute immediately if immediate option is true", async () => {
    const asyncFn = jest.fn().mockResolvedValue("result")

    await act(async () => {
      renderHook(() => useAsync(asyncFn, { immediate: true }))
    })

    expect(asyncFn).toHaveBeenCalled()
  })

  test("should call onSuccess callback when successful", async () => {
    const onSuccess = jest.fn()
    const asyncFn = jest.fn().mockResolvedValue("result")

    const { result } = renderHook(() => useAsync(asyncFn, { onSuccess }))

    await act(async () => {
      await result.current.execute()
    })

    expect(onSuccess).toHaveBeenCalledWith("result")
  })

  test("should call onError callback when error occurs", async () => {
    const error = new Error("Test error")
    const onError = jest.fn()
    const asyncFn = jest.fn().mockRejectedValue(error)

    const { result } = renderHook(() => useAsync(asyncFn, { onError }))

    await act(async () => {
      await result.current.execute()
    })

    expect(onError).toHaveBeenCalledWith(error)
  })

  test("should reset state correctly", async () => {
    const defaultValue = "default"
    const asyncFn = jest.fn().mockResolvedValue("result")

    const { result } = renderHook(() => useAsync(asyncFn, { defaultValue }))

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toBe("result")

    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBe(defaultValue)
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })
})