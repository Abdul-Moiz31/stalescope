import type { CacheEvent, EventStore } from '../instrument/types'

interface SqliteDatabase {
  exec(sql: string): unknown
  prepare(sql: string): {
    run(...params: unknown[]): unknown
    all(...params: unknown[]): unknown[]
  }
}

// Optional persistence store backed by better-sqlite3. Kept out of the
// default path so consumers who never set store: 'sqlite' don't pay for
// the native dependency. Still caps row count to mirror the ring buffer
// behavior of MemoryStore — persistence shouldn't reintroduce the
// unbounded-growth problem stalescope is meant to catch.
export class SqliteStore implements EventStore {
  private db: SqliteDatabase
  private readonly maxSize: number

  constructor(dbPath: string, maxSize = 500) {
    // require() instead of import — better-sqlite3 is an optional native
    // dependency and must not break consumers using the memory store.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require('better-sqlite3')
    this.db = new Database(dbPath) as SqliteDatabase
    this.maxSize = maxSize
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cache_events (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        data TEXT NOT NULL
      )
    `)
  }

  push(event: CacheEvent): void {
    this.db.prepare('INSERT INTO cache_events (id, timestamp, data) VALUES (?, ?, ?)').run(
      event.id,
      event.timestamp,
      JSON.stringify(event)
    )
    if (this.size() > this.maxSize) {
      this.db.exec(`
        DELETE FROM cache_events WHERE id IN (
          SELECT id FROM cache_events ORDER BY timestamp ASC LIMIT ${this.size() - this.maxSize}
        )
      `)
    }
  }

  getAll(): CacheEvent[] {
    const rows = this.db.prepare('SELECT data FROM cache_events ORDER BY timestamp ASC').all() as {
      data: string
    }[]
    return rows.map((r) => JSON.parse(r.data) as CacheEvent)
  }

  getRecent(n: number): CacheEvent[] {
    const all = this.getAll()
    return all.slice(-n)
  }

  getSince(timestamp: number): CacheEvent[] {
    const rows = this.db
      .prepare('SELECT data FROM cache_events WHERE timestamp >= ? ORDER BY timestamp ASC')
      .all(timestamp) as { data: string }[]
    return rows.map((r) => JSON.parse(r.data) as CacheEvent)
  }

  clear(): void {
    this.db.exec('DELETE FROM cache_events')
  }

  size(): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM cache_events').all()[0] as {
      count: number
    }
    return row.count
  }
}
