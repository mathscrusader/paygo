// app/admin/chat/[id]/page.tsx
import React from "react"

interface Props {
  params: { id: string }
}

export default function AdminChatPage({ params }: Props) {
  return <AdminChat conversationId={params.id} />
}
