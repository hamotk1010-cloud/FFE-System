import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Pool, types } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// FIX: Return Postgres DATE columns as plain 'YYYY-MM-DD' strings.
// By default `pg` converts them to JS Date objects in the server's timezone, which
// (a) breaks `.toISOString()` when the column is TEXT and (b) can shift dates by one day.
types.setTypeParser(1082, (value: string) => value);

if (!process.env.DATABASE_URL) {
  console.error(
    '[DB] DATABASE_URL is not set. All /api routes will fail and the app will only work ' +
      'from each browser\'s own localStorage (QR scans on other devices will show no assets).'
  );
}

// Initialize PostgreSQL connection pool for cloud persistence
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Required for cloud providers like Supabase/Neon. Set DATABASE_SSL=false for a local Postgres.
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});

// ----------------------------------------------------
// DATABASE SETUP
// ----------------------------------------------------

// FIX: The original project never created these tables, so every API call failed with a 500
// and the frontend silently fell back to per-browser localStorage.
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id          TEXT PRIMARY KEY,
      full_name   TEXT NOT NULL,
      department  TEXT,
      title       TEXT,
      email       TEXT,
      photo_url   TEXT,
      joined_date DATE
    );

    CREATE TABLE IF NOT EXISTS ffe_assets (
      id                      TEXT PRIMARY KEY,
      tag_number              TEXT,
      name                    TEXT NOT NULL,
      category                TEXT,
      serial_number           TEXT,
      status                  TEXT,
      location                TEXT,
      assigned_to_employee_id TEXT,
      photo_url               TEXT,
      date_added              DATE,
      purchase_cost           NUMERIC,
      notes                   TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_ffe_assets_assigned_to
      ON ffe_assets (assigned_to_employee_id);
  `);

  // Optional: load the sample data from data/store.json into an EMPTY database.
  // Enable with SEED_SAMPLE_DATA=true in your environment.
  if (process.env.SEED_SAMPLE_DATA === 'true') {
    const { rows } = await pool.query(
      'SELECT (SELECT COUNT(*) FROM employees) AS e, (SELECT COUNT(*) FROM ffe_assets) AS a'
    );
    const isEmpty = Number(rows[0].e) === 0 && Number(rows[0].a) === 0;
    const seedFile = path.join(process.cwd(), 'data', 'store.json');

    if (isEmpty && fs.existsSync(seedFile)) {
      const seed = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));
      for (const emp of seed.employees || []) await upsertEmployee(emp);
      for (const asset of seed.assets || []) await upsertAsset(asset);
      console.log(
        `[DB] Seeded ${(seed.employees || []).length} employees and ${(seed.assets || []).length} assets.`
      );
    }
  }
}

// ----------------------------------------------------
// ROW MAPPERS + UPSERT HELPERS
// ----------------------------------------------------

function toDateString(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return String(value).split('T')[0];
}

function mapEmployee(row: any) {
  return {
    id: row.id,
    fullName: row.full_name,
    department: row.department,
    title: row.title,
    email: row.email,
    photoUrl: row.photo_url || '',
    joinedDate: toDateString(row.joined_date),
  };
}

function mapAsset(row: any) {
  return {
    id: row.id,
    tagNumber: row.tag_number,
    name: row.name,
    category: row.category,
    serialNumber: row.serial_number,
    status: row.status,
    location: row.location,
    assignedToEmployeeId: row.assigned_to_employee_id,
    photoUrl: row.photo_url || '',
    dateAdded: toDateString(row.date_added),
    purchaseCost: row.purchase_cost ? parseFloat(row.purchase_cost) : 0,
    notes: row.notes,
  };
}

type Queryable = { query: (text: string, params?: any[]) => Promise<any> };

async function upsertEmployee(emp: any, db: Queryable = pool) {
  await db.query(
    `INSERT INTO employees (id, full_name, department, title, email, photo_url, joined_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       full_name = EXCLUDED.full_name, department = EXCLUDED.department, title = EXCLUDED.title,
       email = EXCLUDED.email, photo_url = EXCLUDED.photo_url, joined_date = EXCLUDED.joined_date`,
    [
      emp.id,
      emp.fullName,
      emp.department,
      emp.title,
      emp.email,
      emp.photoUrl || null,
      emp.joinedDate || null,
    ]
  );
}

async function upsertAsset(asset: any, db: Queryable = pool) {
  await db.query(
    `INSERT INTO ffe_assets (id, tag_number, name, category, serial_number, status, location, assigned_to_employee_id, photo_url, date_added, purchase_cost, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (id) DO UPDATE SET
       tag_number = EXCLUDED.tag_number, name = EXCLUDED.name, category = EXCLUDED.category,
       serial_number = EXCLUDED.serial_number, status = EXCLUDED.status, location = EXCLUDED.location,
       assigned_to_employee_id = EXCLUDED.assigned_to_employee_id, photo_url = EXCLUDED.photo_url,
       date_added = EXCLUDED.date_added, purchase_cost = EXCLUDED.purchase_cost, notes = EXCLUDED.notes`,
    [
      asset.id,
      asset.tagNumber || null,
      asset.name,
      asset.category,
      asset.serialNumber,
      asset.status,
      asset.location,
      asset.assignedToEmployeeId || null,
      asset.photoUrl || null,
      asset.dateAdded || null,
      asset.purchaseCost || 0,
      asset.notes || null,
    ]
  );
}

// Helper: Load all data from PostgreSQL tables
async function fetchStoreFromDb() {
  const empResult = await pool.query('SELECT * FROM employees ORDER BY id');
  const assetResult = await pool.query('SELECT * FROM ffe_assets ORDER BY id');

  return {
    employees: empResult.rows.map(mapEmployee),
    assets: assetResult.rows.map(mapAsset),
    deletedEmployeeIds: [],
    deletedAssetIds: [],
  };
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health check (also reports whether the database is reachable)
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ status: 'error', db: 'unreachable', message: err?.message });
  }
});

// 2. Get all live data from cloud database
app.get('/api/data', async (req, res) => {
  try {
    const data = await fetchStoreFromDb();
    res.json(data);
  } catch (err) {
    console.error('[DB] Error fetching data:', err);
    res.status(500).json({ error: 'Failed to fetch data from cloud database' });
  }
});

// 3. QR SCAN ENDPOINT: single employee + the FFE assets currently assigned to them.
// FIX: Queries the database directly (case/whitespace-insensitive) instead of loading the
// whole store, and this is now what the public QR profile page calls.
app.get('/api/employee/:id', async (req, res) => {
  const id = String(req.params.id || '').trim();
  try {
    const empResult = await pool.query(
      'SELECT * FROM employees WHERE LOWER(TRIM(id)) = LOWER($1) LIMIT 1',
      [id]
    );
    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const employee = mapEmployee(empResult.rows[0]);

    const assetResult = await pool.query(
      `SELECT * FROM ffe_assets
       WHERE LOWER(TRIM(assigned_to_employee_id)) = LOWER($1)
         AND LOWER(COALESCE(status, 'assigned')) IN ('assigned', 'active', 'deployed')
       ORDER BY id`,
      [employee.id]
    );

    res.json({ employee, assignedAssets: assetResult.rows.map(mapAsset) });
  } catch (err) {
    console.error('[DB] Error fetching employee audit:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 4. Update assets (Upsert into PostgreSQL)
app.post('/api/assets', async (req, res) => {
  const { assets } = req.body;
  if (!Array.isArray(assets)) {
    return res.status(400).json({ error: 'Invalid assets array' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const asset of assets) {
        await upsertAsset(asset, client);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    const updatedStore = await fetchStoreFromDb();
    res.json({ success: true, assets: updatedStore.assets });
  } catch (err) {
    console.error('[DB] Error saving assets:', err);
    res.status(500).json({ error: 'Failed to save assets to database' });
  }
});

// 5. Update employees (Upsert into PostgreSQL)
app.post('/api/employees', async (req, res) => {
  const { employees } = req.body;
  if (!Array.isArray(employees)) {
    return res.status(400).json({ error: 'Invalid employees array' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const emp of employees) {
        await upsertEmployee(emp, client);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    const updatedStore = await fetchStoreFromDb();
    res.json({ success: true, employees: updatedStore.employees });
  } catch (err) {
    console.error('[DB] Error saving employees:', err);
    res.status(500).json({ error: 'Failed to save employees to database' });
  }
});

// 6. Direct Assign / Unassign endpoint
app.post('/api/assign', async (req, res) => {
  const { assetId, employeeId } = req.body;
  if (!assetId) {
    return res.status(400).json({ error: 'assetId is required' });
  }

  try {
    const status = employeeId ? 'Assigned' : 'Available';
    await pool.query(
      `UPDATE ffe_assets SET assigned_to_employee_id = $1, status = $2 WHERE id = $3`,
      [employeeId || null, status, assetId]
    );

    const updatedStore = await fetchStoreFromDb();
    res.json({ success: true, assets: updatedStore.assets });
  } catch (err) {
    console.error('[DB] Error assigning asset:', err);
    res.status(500).json({ error: 'Failed to update asset assignment' });
  }
});

// 7. Full Sync endpoint
app.post('/api/sync', async (req, res) => {
  const { employees, assets } = req.body;
  try {
    if (Array.isArray(employees)) {
      for (const emp of employees) {
        await upsertEmployee(emp);
      }
    }
    if (Array.isArray(assets)) {
      for (const asset of assets) {
        await upsertAsset(asset);
      }
    }

    const updatedStore = await fetchStoreFromDb();
    res.json({ success: true, employees: updatedStore.employees, assets: updatedStore.assets });
  } catch (err) {
    console.error('[DB] Error during sync:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// 8. Reset endpoint
app.post('/api/reset', async (req, res) => {
  try {
    await pool.query('DELETE FROM ffe_assets');
    await pool.query('DELETE FROM employees');
    const updatedStore = await fetchStoreFromDb();
    res.json({ success: true, employees: updatedStore.employees, assets: updatedStore.assets });
  } catch (err) {
    console.error('[DB] Error resetting database:', err);
    res.status(500).json({ error: 'Reset failed' });
  }
});

// ----------------------------------------------------
// VITE / STATIC SERVING
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Cloud Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

// FIX: create the tables first, then start. If the DB is unreachable we still start the
// web server (and log why) so the problem is visible via /api/health instead of a dead app.
initDb()
  .then(() => console.log('[DB] Tables ready.'))
  .catch((err) => console.error('[DB] Initialization failed:', err))
  .finally(() => startServer());
