import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

// GET /api/teams/[teamId]/members - List team members
export async function GET(req: Request, context: { params: { teamId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userId = user.id

    // Access teamId from context.params instead of destructuring
    const resolvedParams = await Promise.resolve(context.params)
    const teamId = resolvedParams.teamId

    // Check if user is a member of the team
    const membership = await executeQuery(
      `
      SELECT * FROM team_members
      WHERE team_id = $1 AND user_id = $2
    `,
      [teamId, userId],
    )

    const isOwner = await executeQuery(
      `
      SELECT * FROM teams
      WHERE id = $1 AND owner_id = $2
    `,
      [teamId, userId],
    )

    if (membership.length === 0 && isOwner.length === 0) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get team members with user details
    const members = await executeQuery(
      `
      SELECT tm.id, tm.role, tm.created_at, u.id as user_id, u.name, u.email, u.image
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
      ORDER BY tm.created_at ASC
    `,
      [teamId],
    )

    return NextResponse.json(members)
  } catch (error) {
    console.error("[TEAM_MEMBERS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// POST /api/teams/[teamId]/members - Add team member
export async function POST(req: Request, context: { params: { teamId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userId = user.id

    // Access teamId from context.params instead of destructuring
    const resolvedParamsPost = await Promise.resolve(context.params)
    const teamId = resolvedParamsPost.teamId
    const { email, role = "MEMBER" } = await req.json()

    if (!email) {
      return new NextResponse("Email is required", { status: 400 })
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

    // Find user by email
    const userResult = await executeQuery(
      `
      SELECT * FROM users
      WHERE email = $1
    `,
      [email],
    )

    if (userResult.length === 0) {
      return new NextResponse("User not found", { status: 404 })
    }

    const newUser = userResult[0]

    // Check if user is already a member
    const existingMember = await executeQuery(
      `
      SELECT * FROM team_members
      WHERE team_id = $1 AND user_id = $2
    `,
      [teamId, newUser.id],
    )

    if (existingMember.length > 0) {
      return new NextResponse("User is already a member", { status: 400 })
    }

    // Add user to team
    const newMember = await executeQuery(
      `
      INSERT INTO team_members (team_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
      [teamId, newUser.id, role],
    )

    // Get user details for response
    const memberWithUser = {
      ...newMember[0],
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        image: newUser.image,
      },
    }

    return NextResponse.json(memberWithUser)
  } catch (error) {
    console.error("[TEAM_MEMBERS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
