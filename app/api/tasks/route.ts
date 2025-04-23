import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, listId, boardId, dueDate, priority, assignedTo, selectedLabels, attachments } =
      await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    let finalListId = listId

    // If no listId is provided but boardId is, get the first list of the board
    if (!listId && boardId) {
      const [firstList] = await executeQuery(`SELECT id FROM lists WHERE board_id = $1 ORDER BY position ASC LIMIT 1`, [
        boardId,
      ])

      if (firstList) {
        finalListId = firstList.id
      } else {
        return NextResponse.json({ error: "No list found for this board" }, { status: 400 })
      }
    }

    // If neither listId nor boardId is provided, create a personal task
    if (!finalListId && !boardId) {
      // Get or create a personal tasks board
      const personalBoard = await executeQuery(
        `SELECT b.id FROM boards b
         JOIN board_members bm ON b.id = bm.board_id
         WHERE b.title = 'Personal Tasks' AND bm.user_id = $1 LIMIT 1`,
        [user.id],
      )

      if (personalBoard.length === 0) {
        // Create personal board
        const [newBoard] = await executeQuery(
          `INSERT INTO boards (title, created_by) 
           VALUES ('Personal Tasks', $1) 
           RETURNING id`,
          [user.id],
        )

        // Add user as board member
        await executeQuery(
          `INSERT INTO board_members (board_id, user_id, role) 
           VALUES ($1, $2, 'ADMIN')`,
          [newBoard.id, user.id],
        )

        // Create default lists
        const [todoList] = await executeQuery(
          `INSERT INTO lists (board_id, title, position) 
           VALUES ($1, 'To Do', 0) 
           RETURNING id`,
          [newBoard.id],
        )

        await executeQuery(
          `INSERT INTO lists (board_id, title, position) 
           VALUES ($1, 'In Progress', 1)`,
          [newBoard.id],
        )

        await executeQuery(
          `INSERT INTO lists (board_id, title, position) 
           VALUES ($1, 'Done', 2)`,
          [newBoard.id],
        )

        finalListId = todoList.id
      } else {
        // Get the "To Do" list from personal board
        const [todoList] = await executeQuery(
          `SELECT id FROM lists 
           WHERE board_id = $1 AND title = 'To Do' LIMIT 1`,
          [personalBoard[0].id],
        )

        finalListId = todoList?.id

        // If no "To Do" list, get the first list
        if (!finalListId) {
          const [firstList] = await executeQuery(
            `SELECT id FROM lists 
             WHERE board_id = $1 ORDER BY position ASC LIMIT 1`,
            [personalBoard[0].id],
          )

          finalListId = firstList?.id
        }
      }
    }

    if (!finalListId) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 })
    }

    // Verify the user has access to the list
    const [taskList] = await executeQuery(`SELECT board_id FROM lists WHERE id = $1`, [finalListId])
    if (!taskList) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    // Check if the user is a member of the board
    const [boardMember] = await executeQuery(`SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2`, [
      taskList.board_id,
      user.id,
    ])

    if (!boardMember) {
      return NextResponse.json({ error: "You don't have access to this board" }, { status: 403 })
    }

    // If assigning to someone else, verify they're a board member
    if (assignedTo && assignedTo !== user.id && assignedTo !== "unassigned") {
      const [assigneeMember] = await executeQuery(`SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2`, [
        taskList.board_id,
        assignedTo,
      ])

      if (!assigneeMember) {
        return NextResponse.json({ error: "Cannot assign task to a user who is not a board member" }, { status: 403 })
      }
    }

    // Get the highest position in the list
    const [maxPosition] = await executeQuery(
      `SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM tasks WHERE list_id = $1`,
      [finalListId],
    )

    // Create the task
    const [task] = await executeQuery(
      `INSERT INTO tasks (title, description, list_id, created_by, assigned_to, due_date, priority, position, completed, completed_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING id, title, description, list_id, created_by, assigned_to, due_date, priority, position, created_at, completed, completed_at`,
      [
        title,
        description || null,
        finalListId,
        user.id,
        assignedTo || null,
        dueDate ? new Date(dueDate) : null,
        priority || "MEDIUM",
        maxPosition.next_position,
        false, // Default to not completed
        null, // No completion date
      ],
    )

    // Add labels if selected
    if (selectedLabels && selectedLabels.length > 0) {
      for (const labelId of selectedLabels) {
        try {
          await executeQuery(
            `INSERT INTO task_labels (task_id, label_id) 
             VALUES ($1, $2)
             ON CONFLICT (task_id, label_id) DO NOTHING`,
            [task.id, labelId],
          )
        } catch (error) {
          console.error(`Error adding label ${labelId} to task:`, error)
        }
      }
    }

    // Handle attachments if provided
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          // Check if this is a temporary attachment (from the task creation form)
          if (attachment.id.startsWith("temp-")) {
            // Insert it as a permanent attachment
            await executeQuery(
              `INSERT INTO task_attachments (task_id, created_by, name, url, type, size)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [task.id, user.id, attachment.name, attachment.url, attachment.type, attachment.size],
            )
          }
        } catch (error) {
          console.error(`Error adding attachment to task:`, error)
        }
      }
    }

    // Get the board ID for this task
    const [listBoard] = await executeQuery(`SELECT board_id FROM lists WHERE id = $1`, [finalListId])

    // Log activity
    await executeQuery(
      `INSERT INTO activities (user_id, entity_type, entity_id, action, created_at, board_id)
       VALUES ($1, 'TASK', $2, 'CREATED', NOW(), $3)`,
      [user.id, task.id, listBoard.board_id],
    )

    // Notify assignee if different from creator
    if (assignedTo && assignedTo !== user.id) {
      await executeQuery(
        `INSERT INTO notifications (user_id, type, content, entity_type, entity_id, created_at)
         VALUES ($1, 'TASK_ASSIGNED', $2, 'TASK', $3, NOW())`,
        [assignedTo, `${user.name} assigned you a task: ${title}`, task.id],
      )
    }

    // Fetch and return the task with all its data including attachments
    const [taskWithDetails] = await executeQuery(
      `SELECT t.*, l.title as list_title, b.title as board_title, 
              u.name as assignee_name, u.image as assignee_image,
              t.completed, t.completed_at
       FROM tasks t
       JOIN lists l ON t.list_id = l.id
       JOIN boards b ON l.board_id = b.id
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.id = $1`,
      [task.id],
    )

    // Fetch attachments
    const attachmentResults = await executeQuery(
      `SELECT ta.*, u.name as uploader_name
       FROM task_attachments ta
       JOIN users u ON ta.created_by = u.id
       WHERE ta.task_id = $1
       ORDER BY ta.created_at DESC`,
      [task.id],
    )

    taskWithDetails.attachments = attachmentResults

    return NextResponse.json(taskWithDetails)
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get("boardId")
    const listId = searchParams.get("listId")
    const assignedToMe = searchParams.get("assignedToMe") === "true"
    const dueDate = searchParams.get("dueDate")
    const filter = searchParams.get("filter")
    const showCompleted = searchParams.get("showCompleted") === "true" || filter === "completed"

    let query = `
      SELECT t.*, l.title as list_title, b.title as board_title, 
             u.name as assignee_name, u.image as assignee_image,
             t.completed, t.completed_at
      FROM tasks t
      JOIN lists l ON t.list_id = l.id
      JOIN boards b ON l.board_id = b.id
      JOIN board_members bm ON b.id = bm.board_id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE bm.user_id = $1
    `

    const queryParams = [user.id]
    let paramIndex = 2

    // Filter by completion status unless explicitly showing completed tasks
    if (!showCompleted) {
      query += ` AND (t.completed = false OR t.completed IS NULL)`
    } else if (filter === "completed") {
      query += ` AND t.completed = true`
    }

    if (boardId) {
      query += ` AND b.id = $${paramIndex}`
      queryParams.push(boardId)
      paramIndex++
    }

    if (listId) {
      query += ` AND l.id = $${paramIndex}`
      queryParams.push(listId)
      paramIndex++
    }

    if (assignedToMe) {
      query += ` AND t.assigned_to = $${paramIndex}`
      queryParams.push(user.id)
      paramIndex++
    }

    if (dueDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (dueDate === "today") {
        query += ` AND DATE(t.due_date) = DATE($${paramIndex})`
        queryParams.push(today.toISOString())
      } else if (dueDate === "overdue") {
        query += ` AND t.due_date < $${paramIndex} AND (t.completed = false OR t.completed IS NULL)`
        queryParams.push(today.toISOString())
      } else if (dueDate === "upcoming") {
        const nextWeek = new Date(today)
        nextWeek.setDate(nextWeek.getDate() + 7)

        query += ` AND t.due_date > $${paramIndex} AND t.due_date <= $${paramIndex + 1}`
        queryParams.push(today.toISOString(), nextWeek.toISOString())
        paramIndex++
      }
    }

    if (filter === "tomorrow") {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      const dayAfterTomorrow = new Date(tomorrow)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

      query += ` AND t.due_date >= $${paramIndex} AND t.due_date < $${paramIndex + 1}`
      queryParams.push(tomorrow.toISOString(), dayAfterTomorrow.toISOString())
      paramIndex += 2
    } else if (filter === "week") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      query += ` AND t.due_date > $${paramIndex} AND t.due_date <= $${paramIndex + 1}`
      queryParams.push(tomorrow.toISOString(), nextWeek.toISOString())
      paramIndex += 2
    } else if (filter === "month") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

      query += ` AND t.due_date > $${paramIndex} AND t.due_date <= $${paramIndex + 1}`
      queryParams.push(nextWeek.toISOString(), endOfMonth.toISOString())
      paramIndex += 2
    } else if (filter === "nodate") {
      query += ` AND t.due_date IS NULL`
    } else if (filter === "overdue") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      query += ` AND t.due_date < $${paramIndex} AND (t.completed = false OR t.completed IS NULL)`
      queryParams.push(today.toISOString())
      paramIndex++
    }

    query += ` ORDER BY t.position ASC`

    const tasks = await executeQuery(query, queryParams)

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}
