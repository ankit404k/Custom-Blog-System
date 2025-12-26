const { pool } = require('../config/database');

/**
 * Convert a title to a URL-friendly slug
 * @param {string} title - The title to convert
 * @returns {string} - The slug (kebab-case)
 */
const generateSlug = (title) => {
  return title
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Ensure slug is unique in the database
 * @param {string} baseSlug - The base slug to check
 * @param {number} excludeId - Exclude post ID when checking (for updates)
 * @returns {Promise<string>} - Unique slug
 */
const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    let query = 'SELECT id FROM posts WHERE slug = ? AND deleted_at IS NULL';
    const params = [slug];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

module.exports = {
  generateSlug,
  ensureUniqueSlug,
};
