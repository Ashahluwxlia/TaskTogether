import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const boardId = uuidv4()
    const categoryId = uuidv4()

    // Create the board
    const [board] = await executeQuery(
      `INSERT INTO boards (id, name, title, created_by) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, name, title, created_at`,
      [boardId, title, title, user.id],
    )

    console.log("Created board:", board)

    // Add the creator as a board member with admin role
    const [boardMember] = await executeQuery(
      `INSERT INTO board_members (board_id, user_id, role, is_starred) 
     VALUES ($1, $2, 'ADMIN', false)
     RETURNING board_id, user_id, role`,
      [boardId, user.id],
    )

    console.log("Added board member:", boardMember)

    // Create the category
    const [category] = await executeQuery(
      `INSERT INTO categories (id, name, title, description, created_by) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING id, name, title, description, created_at`,
      [categoryId, title, title, description || null, user.id],
    )

    console.log("Created category:", category)

    // Associate the board with the category
    await executeQuery(
      `INSERT INTO board_categories (board_id, category_id) 
     VALUES ($1, $2)
     RETURNING board_id, category_id`,
      [boardId, category.id],
    )

    // Add the user as a member of the category with admin role
    await executeQuery(
      `INSERT INTO category_members (category_id, user_id, role) 
     VALUES ($1, $2, 'ADMIN')
     RETURNING category_id, user_id, role`,
      [category.id, user.id],
    )

    // Verify board member was added correctly
    const boardMembers = await executeQuery(`SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2`, [
      boardId,
      user.id,
    ])

    console.log("Verified board members:", boardMembers)

    // Add board ID to the response
    category.board_id = boardId

    // Add member count and members for the response
    category.member_count = 1
    category.members = [
      {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    ]

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get categories where the user is a member
    const categories = await executeQuery(
      `SELECT c.id, c.title, c.description, c.created_at,
      (SELECT COUNT(*) FROM category_members WHERE category_id = c.id) as member_count,
      (SELECT b.id FROM boards b 
       JOIN board_categories bc ON b.id = bc.board_id 
       WHERE bc.category_id = c.id 
       LIMIT 1) as board_id,
      (SELECT bm.is_starred FROM board_members bm 
 JOIN boards b ON bm.board_id = b.id 
 JOIN board_categories bc ON b.id = bc.board_id 
 WHERE bc.category_id = c.id AND bm.user_id = $1 AND bm.board_id = b.id
 AND bm.is_starred = true) as is_starred
     FROM categories c
     JOIN category_members cm ON c.id = cm.category_id
     WHERE cm.user_id = $1
     ORDER BY c.created_at DESC`,
      [user.id],
    )

    // For each category, get the members (limited to 5)
    for (const category of categories) {
      const members = await executeQuery(
        `SELECT u.id, u.name, u.image
       FROM category_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.category_id = $1
       LIMIT 5`,
        [category.id],
      )

      category.members = members
    }

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}
