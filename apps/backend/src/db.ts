import Database from 'better-sqlite3';

const dbPath = process.env.CPG_DB_PATH ?? './data/cpg.db';

let db: Database.Database;

export const getDb = (): Database.Database => {
  if (!db) {
    db = new Database(dbPath, { readonly: true, fileMustExist: true });

    db.pragma('journal_mode = OFF');
    db.pragma('cache_size = -64000');
    db.pragma('mmap_size = 268435456');
    db.pragma('temp_store = memory');
  }
  return db;
};

export const closeDb = (): void => {
  if (db) {
    db.close();
  }
};
