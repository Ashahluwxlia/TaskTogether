import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

// GET /api/teams/[teamId] - Get team details
export async function GET(req: Request, { params }: { params: { teamId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userId = user.id

    // Properly await params before accessing teamId
    const resolvedParams = await Promise.resolve(params)
    const teamId = resolvedParams.teamId

    // Check if user is a member of the team
    const membership = await executeQuery(
      `
      SELECT * FROM team_members
      WHERE team_id = $1 AND user_id = $2
    `,
      [teamId, userId],
    )

    if (membership.length === 0) {
      // Check if user is the owner
      const team = await executeQuery(
        `
        SELECT * FROM teams
        WHERE id = $1 AND owner_id = $2
      `,
        [teamId, userId],
      )

      if (team.length === 0) {
        return new NextResponse("Unauthorized", { status: 401 })
      }
    }

    // Get team details
    const teamResult = await executeQuery(
      `
      SELECT * FROM teams
      WHERE id = $1
    `,
      [teamId],
    )

    if (teamResult.length === 0) {
      return new NextResponse("Team not found", { status: 404 })
    }

    const team = teamResult[0]

    // Get team members
    const members = await executeQuery(
      `
      SELECT tm.role, u.id, u.name, u.email, u.image
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
    `,
      [teamId],
    )

    // Get team boards
    const boards = await executeQuery(
      `
      SELECT b.* 
      FROM boards b
      WHERE b.team_id = $1
      ORDER BY b.created_at DESC
    `,
      [teamId],
    )

    return NextResponse.json({
      ...team,
      members,
      boards,
    })
  } catch (error) {
    console.error("[TEAM_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// PUT /api/teams/[teamId] - Update team
export async function PUT(req: Request, { params }: { params: { teamId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userId = user.id

    // Properly await params before accessing teamId
    const resolvedParams = await Promise.resolve(params)
    const teamId = resolvedParams.teamId
    const { name, description } = await req.json()

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    // Check if user is the owner or admin
    const team = await executeQuery(
      `
      SELECT * FROM teams
      WHERE id = $1 AND owner_id = $2
    `,
      [teamId, userId],
    )

    if (team.length === 0) {
      // Check if user is an admin
      const membership = await executeQuery(
        `
        SELECT * FROM team_members
        WHERE team_id = $1 AND user_id = $2 AND role = 'ADMIN'
      `,
        [teamId, userId],
      )

      if (membership.length === 0) {
        return new NextResponse("Unauthorized", { status: 401 })
      }
    }

    // Update team
    const updatedTeam = await executeQuery(
      `
      UPDATE teams
      SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `,
      [name, description || null, teamId],
    )

    return NextResponse.json(updatedTeam[0])
  } catch (error) {
    console.error("[TEAM_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// DELETE /api/teams/[teamId] - Delete team
export async function DELETE(req: Request, { params }: { params: { teamId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userId = user.id

    // Properly await params before accessing teamId
    const resolvedParams = await Promise.resolve(params)
    const teamId = resolvedParams.teamId

    // Check if user is the owner
    const team = await executeQuery(
      `
      SELECT * FROM teams
      WHERE id = $1 AND owner_id = $2
    `,
      [teamId, userId],
    )

    if (team.length === 0) {
      // Return a specific error message for non-owners
      return NextResponse.json(
        {
          error: "Permission denied",
          message: "Only the team owner can delete a team",
        },
        { status: 403 },
      )
    }

    // Start a transaction to ensure all related data is deleted
    await executeQuery("BEGIN", [])

    try {
      // Delete team invitations
      await executeQuery(
        `
        DELETE FROM team_invitations
        WHERE team_id = $1
      `,
        [teamId],
      )

      // Delete board invitations for boards belonging to this team
      await executeQuery(
        `
        DELETE FROM board_invitations
        WHERE board_id IN (SELECT id FROM boards WHERE team_id = $1)
      `,
        [teamId],
      )

      // Delete team chat messages
      await executeQuery(
        `
        DELETE FROM team_chat_messages
        WHERE team_id = $1
      `,
        [teamId],
      )

      // Delete activities related to the team
      await executeQuery(
        `
        DELETE FROM activities
        WHERE team_id = $1
      `,
        [teamId],
      )

      // Delete team members
      await executeQuery(
        `
        DELETE FROM team_members
        WHERE team_id = $1
      `,
        [teamId],
      )

      // Delete boards and all related data
      // This will cascade to lists, tasks, comments, attachments, etc.
      await executeQuery(
        `
        DELETE FROM boards
        WHERE team_id = $1
      `,
        [teamId],
      )

      // Finally, delete the team
      await executeQuery(
        `
        DELETE FROM teams
        WHERE id = $1
      `,
        [teamId],
      )

      // Commit the transaction
      await executeQuery("COMMIT", [])

      return NextResponse.json({ success: true })
    } catch (error) {
      // Rollback in case of error
      await executeQuery("ROLLBACK", [])
      console.error("[TEAM_DELETE]", error)
      throw error
    }
  } catch (error) {
    console.error("[TEAM_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
