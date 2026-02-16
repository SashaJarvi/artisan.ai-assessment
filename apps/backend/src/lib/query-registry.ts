import type Database from 'better-sqlite3'
import { getDb } from '../db.js'

interface QueryEntry {
  name: string;
  description: string;
  sql: string;
}

const preparedStatements = new Map<string, Database.Statement>()

export const initQueryRegistry = (): void => {
  const db = getDb()
  const rows = db.prepare('SELECT name, description, sql FROM queries').all() as QueryEntry[]

  for (const row of rows) {
    try {
      const stmt = db.prepare(row.sql)
      preparedStatements.set(row.name, stmt)
    } catch {
      console.warn(`Failed to prepare query "${row.name}": skipping`)
    }
  }

  console.log(`Query registry: ${preparedStatements.size} prepared statements loaded`)
}

export const getQuery = (name: string): Database.Statement | undefined => {
  return preparedStatements.get(name)
}

export const listQueries = (): QueryEntry[] => {
  const db = getDb()
  return db.prepare('SELECT name, description, sql FROM queries').all() as QueryEntry[]
}
