// app/admin/schema/page.tsx

import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@/lib/generated/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

export default async function SchemaPage() {
  // Protect route
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  // 1) List all tables in public schema
  const tables: { table_name: string }[] = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `

  // 2) For each table, list its columns
  const schemaInfo: { table: string; columns: string[] }[] = []
  for (const { table_name } of tables) {
    const cols: { column_name: string }[] = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table_name}
    `
    schemaInfo.push({
      table: table_name,
      columns: cols.map((c) => c.column_name),
    })
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Database Schema (public)</h1>
      {schemaInfo.map(({ table, columns }) => (
        <div key={table} className="bg-white shadow rounded p-4">
          <h2 className="font-semibold">{table}</h2>
          <p className="text-sm text-gray-600">
            Columns: {columns.join(', ')}
          </p>
        </div>
      ))}
    </div>
  )
}
