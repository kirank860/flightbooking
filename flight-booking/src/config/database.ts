import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

// Disable WAL mode completely - use default journal mode
db.run('PRAGMA journal_mode = DELETE', (err) => {
  if (err) console.error('Failed to set journal mode:', err);
});

const pool = {
  query: (text: string, params: any[] = []): Promise<{ rows: any[] }> => {
    return new Promise((resolve, reject) => {
      try {
        const sqliteText = text.replace(/\$(\d+)/g, '?');
        const isSelect = /^\s*SELECT/i.test(sqliteText);
        const isReturning = /RETURNING/i.test(sqliteText);

        if (isSelect || isReturning) {
          db.all(sqliteText, params, (err, rows) => {
            if (err) reject(err);
            else resolve({ rows: rows || [] });
          });
        } else {
          db.run(sqliteText, params, function(err) {
            if (err) reject(err);
            else resolve({ rows: [{ id: this.lastID }] });
          });
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  connect: async () => ({ query: pool.query, release: () => {} })
};

export default pool;
