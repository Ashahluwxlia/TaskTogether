"use client"

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { TaskCard } from "@/components/task-card"
import { DndContext, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext } from "@dnd-kit/sortable"
import { toast } from "@/hooks/use-toast"

// Mock the toast hook
jest.mock("@/hooks/use-toast", () => ({
  toast: jest.fn(),
}))

// Mock fetch for API calls
global.fetch = jest.fn() as jest.Mock

// 👉 Silence console.log and console.error during tests
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {})
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe("Task Drag and Drop Functionality", () => {
  // Complex test data setup
  const mockTasks = [
    {
      id: "task-1",
      title: "Implement drag and drop",
      description: "Add DnD functionality to task cards",
      due_date: "2023-05-15T00:00:00.000Z",
      priority: "high",
      list_id: "list-1",
      position: 0,
      assigned_to: "user-1",
      assignee_name: "John Doe",
      assignee_image: "/placeholder.svg",
      labels: [
        { id: "label-1", name: "Frontend", color: "#ff0000" },
        { id: "label-2", name: "Bug", color: "#00ff00" },
      ],
      completed: false,
    },
    {
      id: "task-2",
      title: "Write unit tests",
      description: "Create comprehensive test suite",
      due_date: "2023-05-20T00:00:00.000Z",
      priority: "medium",
      list_id: "list-1",
      position: 1,
      assigned_to: "user-2",
      assignee_name: "Jane Smith",
      assignee_image: "/placeholder.svg",
      labels: [{ id: "label-3", name: "Testing", color: "#0000ff" }],
      completed: false,
    },
  ]

  // Mock list data
  const mockLists = [
    { id: "list-1", name: "To Do", position: 0 },
    { id: "list-2", name: "In Progress", position: 1 },
  ]

  // Complex component that wraps TaskCard with DnD context
  const TaskListWithDnd = ({
    tasks,
    lists,
    onDragEnd,
  }: {
    tasks: typeof mockTasks
    lists: typeof mockLists
    onDragEnd: (event: DragEndEvent) => void
  }) => {
    return (
      <DndContext onDragEnd={onDragEnd}>
        {lists.map((list) => (
          <div key={list.id} data-testid={`list-${list.id}`}>
            <h3>{list.name}</h3>
            <SortableContext items={tasks.filter((t) => t.list_id === list.id).map((t) => t.id)}>
              {tasks
                .filter((task) => task.list_id === list.id)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    listId={list.id}
                    onClick={() => {}}
                    onCompletionToggle={() => {}}
                  />
                ))}
            </SortableContext>
          </div>
        ))}
      </DndContext>
    )
  }

  // Mock for the drag end handler
  const mockDragEndHandler = jest.fn()

  // Reset mocks after each test
  afterEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
  })

  // Complex test for task card rendering
  it("renders task cards with correct data and styling", async () => {
    render(<TaskListWithDnd tasks={mockTasks} lists={mockLists} onDragEnd={mockDragEndHandler} />)

    // Verify first task card renders correctly
    expect(screen.getByText("Implement drag and drop")).toBeInTheDocument()

    // Check for priority badge
    const priorityBadge = screen.getByText("high")
    expect(priorityBadge).toBeInTheDocument()
    expect(priorityBadge.className).toContain("bg-red-100")

    // Check for assignee - use a more specific query to avoid the duplicate elements issue
    const avatarFallbacks = screen.getAllByText("J")
    expect(avatarFallbacks.length).toBeGreaterThan(0)
    expect(avatarFallbacks[0]).toBeInTheDocument()

    // Check for labels (represented as colored dots)
    const labelContainers = document.querySelectorAll(".flex-wrap.gap-1.my-1.ml-6")
    expect(labelContainers.length).toBeGreaterThan(0)

    // Verify second task
    expect(screen.getByText("Write unit tests")).toBeInTheDocument()
  })

  // Complex test for task completion toggle
  it("handles task completion toggle with optimistic updates and API calls", async () => {
    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })

    // Create a mock handler that updates the task
    const mockCompletionToggle = jest.fn()

    render(
      <TaskCard task={mockTasks[0]} listId="list-1" onClick={() => {}} onCompletionToggle={mockCompletionToggle} />,
    )

    // Find and click the checkbox
    const checkbox = screen.getByRole("checkbox")
    fireEvent.click(checkbox)

    // Verify the handler was called with correct arguments
    expect(mockCompletionToggle).toHaveBeenCalledWith("task-1", true)

    // Verify API was called correctly
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tasks/task-1/complete",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ completed: true }),
        }),
      )
    })

    // Verify toast notification was shown
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Task marked as complete"),
      }),
    )
  })

  // Complex test for error handling during API calls
  it("handles API errors during task completion toggle", async () => {
    // Mock failed API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    })

    const mockCompletionToggle = jest.fn()

    render(
      <TaskCard task={mockTasks[0]} listId="list-1" onClick={() => {}} onCompletionToggle={mockCompletionToggle} />,
    )

    // Find and click the checkbox
    const checkbox = screen.getByRole("checkbox")
    fireEvent.click(checkbox)

    // Verify the handler was called
    expect(mockCompletionToggle).toHaveBeenCalledWith("task-1", true)

    // Verify API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // Verify error toast was shown
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error",
          variant: "destructive",
        }),
      )
    })

    // Verify the handler was called again to revert the optimistic update
    expect(mockCompletionToggle).toHaveBeenCalledWith("task-1", false)
  })
})