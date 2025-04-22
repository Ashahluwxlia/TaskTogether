"use client"

import { useState } from "react"
import Link from "next/link"
import { Calendar, Clock, File, MessageSquare, Tag } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SearchContent({ results, query }: { results: any; query: string }) {
  const [activeTab, setActiveTab] = useState("all")

  // Handle case where results is undefined
  if (!results) {
    results = {
      tasks: [],
      boards: [],
      labels: [],
      users: [],
      comments: [],
      attachments: [],
    }
  }

  const { tasks, boards, labels, users, comments, attachments } = results

  const totalResults =
    (tasks?.length || 0) +
    (boards?.length || 0) +
    (labels?.length || 0) +
    (users?.length || 0) +
    (comments?.length || 0) +
    (attachments?.length || 0)

  if (totalResults === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No results found</h2>
        <p className="text-muted-foreground">
          We couldn&apos;t find anything matching &quot;{query}&quot;. Try different keywords or check your spelling.
        </p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="all">
          All Results <Badge className="ml-2">{totalResults}</Badge>
        </TabsTrigger>
        {tasks?.length > 0 && (
          <TabsTrigger value="tasks">
            Tasks <Badge className="ml-2">{tasks.length}</Badge>
          </TabsTrigger>
        )}
        {boards?.length > 0 && (
          <TabsTrigger value="boards">
            Boards <Badge className="ml-2">{boards.length}</Badge>
          </TabsTrigger>
        )}
        {labels?.length > 0 && (
          <TabsTrigger value="labels">
            Labels <Badge className="ml-2">{labels.length}</Badge>
          </TabsTrigger>
        )}
        {users?.length > 0 && (
          <TabsTrigger value="users">
            Users <Badge className="ml-2">{users.length}</Badge>
          </TabsTrigger>
        )}
        {comments?.length > 0 && (
          <TabsTrigger value="comments">
            Comments <Badge className="ml-2">{comments.length}</Badge>
          </TabsTrigger>
        )}
        {attachments?.length > 0 && (
          <TabsTrigger value="attachments">
            Attachments <Badge className="ml-2">{attachments.length}</Badge>
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="all" className="space-y-8">
        {tasks?.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Tasks</h2>
            <div className="space-y-4">
              {tasks.slice(0, 5).map((task: any) => (
                <TaskResult key={task.id} task={task} />
              ))}
              {tasks.length > 5 && (
                <div className="text-right">
                  <button onClick={() => setActiveTab("tasks")} className="text-primary hover:underline">
                    View all {tasks.length} tasks
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {boards?.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Boards</h2>
            <div className="space-y-4">
              {boards.slice(0, 5).map((board: any) => (
                <BoardResult key={board.id} board={board} />
              ))}
              {boards.length > 5 && (
                <div className="text-right">
                  <button onClick={() => setActiveTab("boards")} className="text-primary hover:underline">
                    View all {boards.length} boards
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {labels?.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Labels</h2>
            <div className="space-y-4">
              {labels.slice(0, 5).map((label: any) => (
                <LabelResult key={label.id} label={label} />
              ))}
              {labels.length > 5 && (
                <div className="text-right">
                  <button onClick={() => setActiveTab("labels")} className="text-primary hover:underline">
                    View all {labels.length} labels
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {users?.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Users</h2>
            <div className="space-y-4">
              {users.slice(0, 5).map((user: any) => (
                <UserResult key={user.id} user={user} />
              ))}
              {users.length > 5 && (
                <div className="text-right">
                  <button onClick={() => setActiveTab("users")} className="text-primary hover:underline">
                    View all {users.length} users
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {comments?.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Comments</h2>
            <div className="space-y-4">
              {comments.slice(0, 5).map((comment: any) => (
                <CommentResult key={comment.id} comment={comment} />
              ))}
              {comments.length > 5 && (
                <div className="text-right">
                  <button onClick={() => setActiveTab("comments")} className="text-primary hover:underline">
                    View all {comments.length} comments
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {attachments?.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Attachments</h2>
            <div className="space-y-4">
              {attachments.slice(0, 5).map((attachment: any) => (
                <AttachmentResult key={attachment.id} attachment={attachment} />
              ))}
              {attachments.length > 5 && (
                <div className="text-right">
                  <button onClick={() => setActiveTab("attachments")} className="text-primary hover:underline">
                    View all {attachments.length} attachments
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="tasks">
        <h2 className="text-xl font-semibold mb-4">Tasks</h2>
        <div className="space-y-4">
          {tasks?.map((task: any) => (
            <TaskResult key={task.id} task={task} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="boards">
        <h2 className="text-xl font-semibold mb-4">Boards</h2>
        <div className="space-y-4">
          {boards?.map((board: any) => (
            <BoardResult key={board.id} board={board} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="labels">
        <h2 className="text-xl font-semibold mb-4">Labels</h2>
        <div className="space-y-4">
          {labels?.map((label: any) => (
            <LabelResult key={label.id} label={label} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="users">
        <h2 className="text-xl font-semibold mb-4">Users</h2>
        <div className="space-y-4">
          {users?.map((user: any) => (
            <UserResult key={user.id} user={user} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="comments">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        <div className="space-y-4">
          {comments?.map((comment: any) => (
            <CommentResult key={comment.id} comment={comment} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="attachments">
        <h2 className="text-xl font-semibold mb-4">Attachments</h2>
        <div className="space-y-4">
          {attachments?.map((attachment: any) => (
            <AttachmentResult key={attachment.id} attachment={attachment} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}

function TaskResult({ task }: { task: any }) {
  return (
    <Link href={`/tasks/${task.id}`} className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">{task.title}</h3>
          {task.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{task.description}</p>}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              In {task.board_name} / {task.list_title}
            </span>
            {task.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {task.assignee_name && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
              {task.assignee_image ? (
                <img
                  src={task.assignee_image || "/placeholder.svg"}
                  alt={task.assignee_name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                task.assignee_name.charAt(0)
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}

function BoardResult({ board }: { board: any }) {
  return (
    <Link href={`/boards/${board.id}`} className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">{board.name}</h3>
          {board.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{board.description}</p>}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>{board.list_count || 0} lists</span>
            <span>{board.task_count || 0} tasks</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function LabelResult({ label }: { label: any }) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4" />
        <h3 className="font-medium">{label.name}</h3>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        <p>Used in {label.usage_count || 0} tasks</p>
        <p>Board: {label.board_name}</p>
      </div>
      <div className="mt-2">
        <Link href={`/boards/${label.board_id}`} className="text-sm text-primary hover:underline">
          View board
        </Link>
      </div>
    </div>
  )
}

function UserResult({ user }: { user: any }) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
          {user.image ? (
            <img src={user.image || "/placeholder.svg"} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            user.name.charAt(0)
          )}
        </div>
        <div>
          <h3 className="font-medium">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        <p>{user.shared_boards_count || 0} shared boards</p>
      </div>
    </div>
  )
}

function CommentResult({ comment }: { comment: any }) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-start gap-3">
        <MessageSquare className="h-4 w-4 mt-1" />
        <div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">
              {comment.author_image ? (
                <img
                  src={comment.author_image || "/placeholder.svg"}
                  alt={comment.author_name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                comment.author_name?.charAt(0)
              )}
            </div>
            <span className="font-medium text-sm">{comment.author_name}</span>
            <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
          </div>
          <p className="text-sm mt-1 line-clamp-2">{comment.content}</p>
          <div className="mt-2 text-xs text-muted-foreground">
            <Link href={`/tasks/${comment.task_id}`} className="text-primary hover:underline">
              On task: {comment.task_title}
            </Link>
            <span className="mx-1">•</span>
            <span>
              In {comment.board_name} / {comment.list_title}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function AttachmentResult({ attachment }: { attachment: any }) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-start gap-3">
        <File className="h-4 w-4 mt-1" />
        <div>
          <h3 className="font-medium">{attachment.name}</h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>Uploaded by {attachment.uploader_name}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(attachment.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="mt-2 text-xs">
            <Link href={`/tasks/${attachment.task_id}`} className="text-primary hover:underline">
              On task: {attachment.task_title}
            </Link>
            <span className="mx-1">•</span>
            <span>
              In {attachment.board_name} / {attachment.list_title}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
