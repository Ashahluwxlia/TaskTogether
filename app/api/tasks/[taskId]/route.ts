import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { createNotification } from "@/lib/notifications"
import { sendTaskAssignmentEmail } from "@/lib/notification-service"

export async function GET(request: Request, { params }: { params: { taskId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Properly await the params object
    const { taskId } = await params

    // Get task with related data
    const taskResult = await executeQuery(
      `SELECT t.*, u.name as assignee_name, u.image as assignee_image,
       l.title as list_title, b.id as board_id, b.title as board_title,
       t.completed, t.completed_at
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      JOIN lists l ON t.list_id = l.id
      JOIN boards b ON l.board_id = b.id
      WHERE t.id = $1 AND EXISTS (
        SELECT 1 FROM board_members bm
        WHERE bm.board_id = b.id AND bm.user_id = $2
      )`,
      [taskId, user.id],
    )

    if (taskResult.length === 0) {
      return NextResponse.json({ error: "Task not found or you do not have access" }, { status: 404 })
    }

    const task = taskResult[0]

    // Get comments
    const comments = await executeQuery(
      `SELECT c.*, u.name as author_name, u.image as author_image
       FROM comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [taskId],
    )

    // Get attachments
    let attachments = []
    try {
      attachments = await executeQuery(
        `SELECT ta.*, u.name as uploader_name
         FROM task_attachments ta
         JOIN users u ON ta.created_by = u.id
         WHERE ta.task_id = $1
         ORDER BY ta.created_at DESC`,
        [taskId],
      )
    } catch (error) {
      console.error("Error fetching attachments:", error)
      attachments = []
    }

    // Get labels
    let labels = []
    try {
      labels = await executeQuery(
        `SELECT l.*
         FROM labels l
         JOIN task_labels tl ON l.id = tl.label_id
         WHERE tl.task_id = $1`,
        [taskId],
      )
    } catch (error) {
      console.error("Error fetching labels:", error)
      labels = []
    }

    return NextResponse.json({
      ...task,
      comments,
      attachments,
      labels: labels || [], // Ensure labels is always an array
    })
  } catch (error) {
    console.error("Error fetching task:", error)
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { taskId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Properly await the params object
    const { taskId } = await params
    const updates = await request.json()

    console.log(`Updating task ${taskId} with:`, updates)

    // Verify user has access to this task
    const hasAccess = await executeQuery(
      `SELECT 1 FROM board_members bm
       JOIN boards b ON bm.board_id = b.id
       JOIN lists l ON b.id = l.board_id
       JOIN tasks t ON l.id = t.list_id
       WHERE bm.user_id = $1 AND t.id = $2`,
      [user.id, taskId],
    )

    if (hasAccess.length === 0) {
      return NextResponse.json({ error: "You do not have access to this task" }, { status: 403 })
    }

    // Get the current task data before updating
    const currentTaskResult = await executeQuery(`SELECT list_id, position, assigned_to FROM tasks WHERE id = $1`, [
      taskId,
    ])

    if (currentTaskResult.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const currentTask = currentTaskResult[0]
    const oldListId = currentTask.list_id
    const oldPosition = Number.parseInt(currentTask.position, 10) // Ensure it's an integer

    // Ensure position is properly parsed as a number
    const newPosition =
      updates.position !== undefined
        ? typeof updates.position === "number"
          ? updates.position
          : Number(updates.position)
        : oldPosition

    console.log(
      `Position conversion: original=${updates.position} (${typeof updates.position}), converted=${newPosition} (${typeof newPosition})`,
    )

    const newListId = updates.list_id !== undefined ? updates.list_id : oldListId
    const isListChanged = newListId !== oldListId

    console.log(`List ID check: oldListId=${oldListId}, newListId=${newListId}, isListChanged=${isListChanged}`)

    // Begin a transaction for all updates
    await executeQuery("BEGIN")

    try {
      // Build update query dynamically
      const allowedFields = [
        "title",
        "description",
        "list_id",
        "position",
        "due_date",
        "priority",
        "assigned_to",
        "completed",
        "completed_at",
      ]
      const setStatements = []
      const queryParams = []

      let paramIndex = 1

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          // Special handling for assigned_to to convert empty string to null
          if (key === "assigned_to" && value === "") {
            setStatements.push(`${key} = NULL`)
          } else if (key === "position") {
            // Ensure position is stored as an integer
            setStatements.push(`${key} = $${paramIndex}::integer`)
            queryParams.push(Number(value))
            paramIndex++
            console.log(
              `Adding position parameter: ${value} (${typeof value}) converted to ${Number(value)} (${typeof Number(value)})`,
            )
          } else if (key === "list_id") {
            // Ensure list_id is properly set
            setStatements.push(`${key} = $${paramIndex}`)
            queryParams.push(value)
            paramIndex++
            console.log(`Adding list_id parameter: ${value} (${typeof value})`)
          } else {
            setStatements.push(`${key} = $${paramIndex}`)
            queryParams.push(value)
            paramIndex++
          }
        }
      }

      if (setStatements.length === 0) {
        await executeQuery("ROLLBACK")
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
      }

      // Add updated_at
      setStatements.push(`updated_at = CURRENT_TIMESTAMP`)

      // Add task ID as the last parameter
      queryParams.push(taskId)

      const query = `
        UPDATE tasks
        SET ${setStatements.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `

      console.log("Executing query:", query)
      console.log("With parameters:", queryParams)

      const result = await executeQuery(query, queryParams)

      if (result.length === 0) {
        await executeQuery("ROLLBACK")
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
      }

      console.log(`Task ${taskId} updated successfully:`, result[0])

      // Add this after the task update query is executed
      console.log(`Task ${taskId} position update details:
        - Old position: ${oldPosition} (${typeof oldPosition})
        - New position: ${newPosition} (${typeof newPosition})
        - List changed: ${isListChanged}
        - Old list: ${oldListId}
        - New list: ${newListId}
      `)

      console.log(`Task ${taskId} position update details (AFTER UPDATE):
  - Task ID: ${taskId}
  - New position in DB: ${result[0].position} (${typeof result[0].position})
  - List ID: ${result[0].list_id}
`)

      // If list_id was changed or position was changed, update the positions of tasks in both lists
      if (isListChanged) {
        console.log(`List changed: Moving task from list ${oldListId} to list ${newListId}`)
        console.log(`Updating positions in old list: decrementing positions > ${oldPosition}`)

        // Update positions in the old list (decrement positions of tasks after the old position)
        const oldListResult = await executeQuery(
          `UPDATE tasks 
           SET position = position - 1, updated_at = CURRENT_TIMESTAMP
           WHERE list_id = $1 AND position > $2
           RETURNING id, title, position`,
          [oldListId, oldPosition],
        )

        console.log(`Updated ${oldListResult.length} tasks in old list:`, oldListResult)

        console.log(`Updating positions in new list: incrementing positions >= ${newPosition}`)

        // Update positions in the new list (increment positions of tasks at or after the new position)
        const newListResult = await executeQuery(
          `UPDATE tasks 
           SET position = position + 1, updated_at = CURRENT_TIMESTAMP
           WHERE list_id = $1 AND position >= $2 AND id != $3
           RETURNING id, title, position`,
          [newListId, newPosition, taskId],
        )

        console.log(`Updated ${newListResult.length} tasks in new list:`, newListResult)
      } else if (newPosition !== oldPosition) {
        // Moving within the same list
        if (newPosition > oldPosition) {
          // Moving down: decrement positions of tasks between old and new positions
          await executeQuery(
            `UPDATE tasks 
             SET position = position - 1, updated_at = CURRENT_TIMESTAMP
             WHERE list_id = $1 AND position > $2 AND position <= $3 AND id != $4`,
            [oldListId, oldPosition, newPosition, taskId],
          )
        } else {
          // Moving up: increment positions of tasks between new and old positions
          await executeQuery(
            `UPDATE tasks 
             SET position = position + 1, updated_at = CURRENT_TIMESTAMP
             WHERE list_id = $1 AND position >= $2 AND position < $3 AND id != $4`,
            [oldListId, newPosition, oldPosition, taskId],
          )
        }
      }

      console.log(`Task ${taskId} position update: from ${oldPosition} to ${newPosition}`)
      console.log(
        `Current positions in list ${newListId}: `,
        await executeQuery(`SELECT id, title, position FROM tasks WHERE list_id = $1 ORDER BY position`, [newListId]),
      )

      // Verify the final position of the updated task
      const finalPositionCheck = await executeQuery(`SELECT id, title, list_id, position FROM tasks WHERE id = $1`, [
        taskId,
      ])
      console.log(`Final position check for task ${taskId}:`, finalPositionCheck[0])

      // Check if assigned_to was changed
      if (updates.assigned_to !== undefined && updates.assigned_to !== currentTask.assigned_to) {
        // Get the task details for the notification
        const taskDetails = await executeQuery(
          `SELECT t.title, b.title as board_title 
           FROM tasks t
           JOIN lists l ON t.list_id = l.id
           JOIN boards b ON l.board_id = b.id
           WHERE t.id = $1`,
          [taskId],
        )

        if (taskDetails.length > 0 && updates.assigned_to) {
          // Create a notification for the new assignee
          const notificationData = {
            userId: updates.assigned_to,
            type: "TASK_ASSIGNED",
            content: `You have been assigned to task "${taskDetails[0].title}" in board "${taskDetails[0].board_title}"`,
            entityType: "TASK",
            entityId: taskId,
          }

          try {
            await createNotification(notificationData)
            await sendTaskAssignmentEmail(taskId, updates.assigned_to)
            console.log(`Created task assignment notification for user ${updates.assigned_to}`)
          } catch (error) {
            console.error("Error creating task assignment notification:", error)
            // Continue execution even if notification fails
          }
        }
      }

      // Commit the transaction
      await executeQuery("COMMIT")

      // After the transaction is committed, verify the positions of all tasks in the list
      const verifyPositions = await executeQuery(
        `SELECT id, title, position FROM tasks WHERE list_id = $1 ORDER BY position`,
        [newListId],
      )
      console.log(`Verified positions in list ${newListId} after update:`, verifyPositions)

      return NextResponse.json(result[0])
    } catch (error) {
      // Rollback in case of error
      await executeQuery("ROLLBACK")
      console.error("Error updating task:", error)
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { taskId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Properly await the params object
    const { taskId } = await params

    // Verify user has access to this task
    const hasAccess = await executeQuery(
      `SELECT 1 FROM board_members bm
       JOIN boards b ON bm.board_id = b.id
       JOIN lists l ON b.id = l.board_id
       JOIN tasks t ON l.id = t.list_id
       WHERE bm.user_id = $1 AND t.id = $2`,
      [user.id, taskId],
    )

    if (hasAccess.length === 0) {
      return NextResponse.json({ error: "You do not have access to this task" }, { status: 403 })
    }

    // Get the task's current list and position
    const taskInfo = await executeQuery(`SELECT list_id, position FROM tasks WHERE id = $1`, [taskId])

    if (taskInfo.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const { list_id, position } = taskInfo[0]

    // Begin transaction
    await executeQuery("BEGIN")

    try {
      // Delete task (cascade will handle related records)
      await executeQuery("DELETE FROM tasks WHERE id = $1", [taskId])

      // Update positions of remaining tasks in the list
      await executeQuery(
        `UPDATE tasks 
         SET position = position - 1, updated_at = CURRENT_TIMESTAMP
         WHERE list_id = $1 AND position > $2`,
        [list_id, position],
      )

      // Commit transaction
      await executeQuery("COMMIT")

      return NextResponse.json({ success: true })
    } catch (error) {
      await executeQuery("ROLLBACK")
      console.error("Error deleting task:", error)
      return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
