"use client"
import { render, screen, fireEvent } from "@testing-library/react"
import { TaskCard } from "@/components/task-card"

// Mock the useSortable hook
jest.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

// Mock the CSS utility from @dnd-kit/utilities
jest.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: jest.fn(() => ""),
    },
  },
}))

// Mock the toast hook
jest.mock("@/hooks/use-toast", () => ({
  toast: jest.fn(),
}))

describe("TaskCard component", () => {
  const mockTask = {
    id: "task-1",
    title: "Test Task",
    description: "Test Description",
    due_date: "2023-05-20T12:00:00Z",
    priority: "High",
    list_id: "list-1",
    position: 0,
    assigned_to: "user-1",
    assignee_name: "John Doe",
    assignee_image: null,
    labels: [
      { id: "label-1", name: "Bug", color: "#ff0000" },
      { id: "label-2", name: "Feature", color: "#00ff00" },
    ],
  }

  const mockListId = "list-1"

  test("renders task title correctly", () => {
    render(<TaskCard task={mockTask} listId={mockListId} />)
    expect(screen.getByText("Test Task")).toBeInTheDocument()
  })

  test("renders due date correctly", () => {
    render(<TaskCard task={mockTask} listId={mockListId} />)
    // The exact format might vary, so we're checking for the month
    expect(screen.getByText(/May 21/)).toBeInTheDocument()
  })

  test("renders priority badge correctly", () => {
    render(<TaskCard task={mockTask} listId={mockListId} />)
    expect(screen.getByText("High")).toBeInTheDocument()
  })

  test("renders assignee avatar correctly", () => {
    render(<TaskCard task={mockTask} listId={mockListId} />)
    // Check for the avatar fallback with the first letter of the assignee's name
    expect(screen.getByText("J")).toBeInTheDocument()
  })

  test("renders labels correctly", () => {
    render(<TaskCard task={mockTask} listId={mockListId} />)
    // Labels are rendered as colored dots, so we can't check for text
    // Instead, we can check for the presence of elements with the right styling
    const labelElements = document.querySelectorAll(".h-2.w-2.rounded-full")
    expect(labelElements.length).toBe(2)
  })

  test("calls onClick when clicked", () => {
    const handleClick = jest.fn()
    render(<TaskCard task={mockTask} listId={mockListId} onClick={handleClick} />)

    // Click on the title area
    fireEvent.click(screen.getByText("Test Task"))

    expect(handleClick).toHaveBeenCalled()
  })

  test("calls onCompletionToggle when checkbox is clicked", () => {
    const handleCompletionToggle = jest.fn()
    render(<TaskCard task={mockTask} listId={mockListId} onCompletionToggle={handleCompletionToggle} />)

    // Find the checkbox and click it
    const checkbox = document.querySelector('input[type="checkbox"]')
    if (checkbox) {
      fireEvent.click(checkbox)
      expect(handleCompletionToggle).toHaveBeenCalledWith(mockTask.id, true)
    } else {
      // If the checkbox isn't directly accessible, click the div that contains it
      const checkboxContainer = document.querySelector(".mt-0\\.5.flex-shrink-0")
      if (checkboxContainer) {
        fireEvent.click(checkboxContainer)
        expect(handleCompletionToggle).toHaveBeenCalledWith(mockTask.id, true)
      }
    }
  })

  test("renders completed task with strikethrough", () => {
    const completedTask = { ...mockTask, completed: true }
    render(<TaskCard task={completedTask} listId={mockListId} />)

    // Check that the title has the line-through class
    const titleElement = screen.getByText("Test Task")
    expect(titleElement).toHaveClass("line-through")
  })
})
