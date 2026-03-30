const { pool } = require("../config/db");

const listDepartments = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT 
          id, code, name, short_name, description, is_active, created_at, updated_at
        FROM departments
        ORDER BY name ASC
      `
    );

    const departments = result.rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      shortName: row.short_name,
      description: row.description,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return res.json({ total: departments.length, departments });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch departments", error: error.message });
  }
};

const createDepartment = async (req, res) => {
  try {
    if (!["admin"].includes(req.user?.role)) {
      return res.status(403).json({ message: "Only admins can create departments" });
    }

    const { code, name, shortName, description } = req.body || {};
    
    if (!code || !name) {
      return res.status(400).json({ message: "code and name are required" });
    }

    const result = await pool.query(
      `
        INSERT INTO departments (code, name, short_name, description, is_active)
        VALUES ($1, $2, $3, $4, TRUE)
        RETURNING id, code, name, short_name, description, is_active, created_at
      `,
      [String(code).toUpperCase(), String(name).trim(), shortName || null, description || null]
    );

    const dept = result.rows[0];
    return res.status(201).json({
      message: "Department created",
      department: {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        shortName: dept.short_name,
        description: dept.description,
        isActive: dept.is_active,
        createdAt: dept.created_at,
      },
    });
  } catch (error) {
    if (String(error.message || "").includes("duplicate key")) {
      return res.status(409).json({ message: "Department code or name already exists" });
    }
    return res.status(500).json({ message: "Failed to create department", error: error.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    if (!["admin"].includes(req.user?.role)) {
      return res.status(403).json({ message: "Only admins can update departments" });
    }

    const departmentId = Number(req.params.departmentId);
    if (Number.isNaN(departmentId) || departmentId <= 0) {
      return res.status(400).json({ message: "Invalid department id" });
    }

    const { name, shortName, description, isActive } = req.body || {};

    const updateFields = [];
    const values = [];
    let paramCount = 0;

    if (name !== undefined) {
      updateFields.push(`name = $${++paramCount}`);
      values.push(String(name).trim());
    }

    if (shortName !== undefined) {
      updateFields.push(`short_name = $${++paramCount}`);
      values.push(shortName || null);
    }

    if (description !== undefined) {
      updateFields.push(`description = $${++paramCount}`);
      values.push(description || null);
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${++paramCount}`);
      values.push(Boolean(isActive));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(departmentId);
    const query = `
      UPDATE departments
      SET ${updateFields.join(", ")}, updated_at = NOW()
      WHERE id = $${++paramCount}
      RETURNING id, code, name, short_name, description, is_active, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Department not found" });
    }

    const dept = result.rows[0];
    return res.json({
      message: "Department updated",
      department: {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        shortName: dept.short_name,
        description: dept.description,
        isActive: dept.is_active,
        updatedAt: dept.updated_at,
      },
    });
  } catch (error) {
    if (String(error.message || "").includes("duplicate key")) {
      return res.status(409).json({ message: "Department name already exists" });
    }
    return res.status(500).json({ message: "Failed to update department", error: error.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    if (!["admin"].includes(req.user?.role)) {
      return res.status(403).json({ message: "Only admins can delete departments" });
    }

    const departmentId = Number(req.params.departmentId);
    if (Number.isNaN(departmentId) || departmentId <= 0) {
      return res.status(400).json({ message: "Invalid department id" });
    }

    const result = await pool.query(
      "DELETE FROM departments WHERE id = $1 RETURNING id",
      [departmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Department not found" });
    }

    return res.json({ message: "Department deleted", id: departmentId });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete department", error: error.message });
  }
};

module.exports = {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
