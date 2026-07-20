const { Pool } = require('pg');
const p = new Pool({ connectionString: 'postgresql://neondb_owner:npg_N3JvcwgDj6ha@ep-damp-moon-aoylojjg.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require', ssl: { rejectUnauthorized: false } });
(async () => {
  const c = await p.connect();
  const r = await c.query("SELECT id, title, url, status, category_id FROM websites WHERE id = 55");
  console.log('广告位:', JSON.stringify(r.rows[0]));
  const cat = await c.query("SELECT id, name FROM categories WHERE slug = 'advertising'");
  console.log('广告分类:', JSON.stringify(cat.rows[0]));
  const allCats = await c.query("SELECT id, name, slug FROM categories ORDER BY id");
  console.log('所有分类:', JSON.stringify(allCats.rows));
  c.release();
  await p.end();
})();
