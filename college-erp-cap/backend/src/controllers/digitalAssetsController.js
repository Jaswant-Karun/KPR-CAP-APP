const { pool, dbState } = require("../config/db");

const memoryDigitalAssets = [];
let nextMemoryAssetId = 1;

const mapRow = (row) => ({
  id: row.id,
  ticketNo: row.ticket_no,
  status: row.status,
  group: row.group_name,
  type: row.asset_type,
  name: row.asset_name,
  order: row.order_no,
  url: row.asset_url,
  createdBy: row.created_by,
  createdByName: row.created_by_name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const listDigitalAssets = async (req, res) => {
  try {
    const group = String(req.query?.group || "").trim().toLowerCase();
    const status = String(req.query?.status || "").trim().toLowerCase();
    const search = String(req.query?.search || "").trim().toLowerCase();

    if (dbState.mode === "postgres") {
      let query = "SELECT * FROM digital_assets WHERE 1=1";
      const params = [];

      if (group) {
        query += ` AND LOWER(group_name) = $${params.length + 1}`;
        params.push(group);
      }

      if (["active", "inactive"].includes(status)) {
        query += ` AND status = $${params.length + 1}`;
        params.push(status);
      }

      if (search) {
        query += ` AND (LOWER(asset_name) LIKE $${params.length + 1} OR LOWER(group_name) LIKE $${params.length + 1})`;
        params.push(`%${search}%`);
      }

      query += " ORDER BY order_no ASC, created_at DESC";
      const result = await pool.query(query, params);
      const assets = result.rows.map(mapRow);
      return res.json({ total: assets.length, assets });
    }

    let rows = [...memoryDigitalAssets];
    if (group) {
      rows = rows.filter((item) => String(item.group).toLowerCase() === group);
    }

    if (["active", "inactive"].includes(status)) {
      rows = rows.filter((item) => String(item.status).toLowerCase() === status);
    }

    if (search) {
      rows = rows.filter(
        (item) =>
          String(item.name || "").toLowerCase().includes(search) ||
          String(item.group || "").toLowerCase().includes(search)
      );
    }

    rows.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    return res.json({ total: rows.length, assets: rows });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load digital assets", error: error.message });
  }
};

const createDigitalAsset = async (req, res) => {
  try {
    const payload = req.body || {};
    const group = String(payload.group || "").trim();
    const type = String(payload.type || "").trim().toLowerCase();
    const name = String(payload.name || "").trim();
    const url = String(payload.url || "").trim();
    const status = String(payload.status || "active").trim().toLowerCase();
    const order = Number(payload.order || 0);

    if (!group || !name || !url) {
      return res.status(400).json({ message: "group, name and url are required" });
    }

    if (!["file", "link"].includes(type)) {
      return res.status(400).json({ message: "type must be file or link" });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "status must be active or inactive" });
    }

    if (!Number.isFinite(order) || order < 0) {
      return res.status(400).json({ message: "order must be a non-negative number" });
    }

    if (dbState.mode === "postgres") {
      const nextIdResult = await pool.query(
        "SELECT nextval(pg_get_serial_sequence('digital_assets', 'id')) AS id"
      );
      const nextId = Number(nextIdResult.rows[0].id);
      const ticketNo = 1000 + nextId;

      const inserted = await pool.query(
        `INSERT INTO digital_assets
          (id, ticket_no, status, group_name, asset_type, asset_name, order_no, asset_url, created_by, created_by_name, created_at, updated_at)
         VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         RETURNING *`,
        [
          nextId,
          ticketNo,
          status,
          group,
          type,
          name,
          order,
          url,
          req.user?.id || null,
          req.user?.name || req.user?.email || "Admin",
        ]
      );

      return res.status(201).json({ message: "Digital asset created", asset: mapRow(inserted.rows[0]) });
    }

    const id = nextMemoryAssetId++;
    const created = {
      id,
      ticketNo: 1000 + id,
      status,
      group,
      type,
      name,
      order,
      url,
      createdBy: req.user?.id || null,
      createdByName: req.user?.name || req.user?.email || "Admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryDigitalAssets.push(created);
    return res.status(201).json({ message: "Digital asset created", asset: created });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create digital asset", error: error.message });
  }
};

const deleteDigitalAsset = async (req, res) => {
  try {
    const assetId = Number(req.params.assetId);
    if (!Number.isFinite(assetId) || assetId <= 0) {
      return res.status(400).json({ message: "Valid assetId is required" });
    }

    if (dbState.mode === "postgres") {
      const result = await pool.query("DELETE FROM digital_assets WHERE id = $1", [assetId]);
      if (!result.rowCount) {
        return res.status(404).json({ message: "Digital asset not found" });
      }
      return res.json({ message: "Digital asset deleted" });
    }

    const index = memoryDigitalAssets.findIndex((item) => Number(item.id) === assetId);
    if (index < 0) {
      return res.status(404).json({ message: "Digital asset not found" });
    }

    memoryDigitalAssets.splice(index, 1);
    return res.json({ message: "Digital asset deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete digital asset", error: error.message });
  }
};

module.exports = {
  listDigitalAssets,
  createDigitalAsset,
  deleteDigitalAsset,
};
