import sys
import re

with open('backend/src/match/controllers/match_controller.js', 'r') as f:
    content = f.read()

synonym_map = """
const SYNONYM_DICTIONARY = {
  'Legal': ['lawyer', 'lawyers', 'solicitor', 'barrister', 'advocate', 'attorney'],
  'Medical': ['doctor', 'nurse', 'hcs', 'clinic', 'physio', 'health', 'triage'],
  'Electric': ['electrician', 'sparky', 'wiring', 'power', 'fuse', 'electrical'],
  'Plumbing': ['plumber', 'pipe', 'leak', 'drain', 'water', 'toilet'],
  'Carpentry': ['carpenter', 'builder', 'wood', 'roof', 'furniture', 'cabinet'],
  'Finance': ['accountant', 'tax', 'bookkeeper', 'loans', 'kingsmen', 'banking']
};

const normalizeSearchTrade = (query) => {
  if (!query) return { original: null, mapped: null };
  const lowerQuery = query.toLowerCase().trim();
  for (const [category, synonyms] of Object.entries(SYNONYM_DICTIONARY)) {
    if (synonyms.some(s => lowerQuery.includes(s)) || category.toLowerCase() === lowerQuery) {
      return { original: lowerQuery, mapped: category };
    }
  }
  return { original: lowerQuery, mapped: null };
};
"""

if 'const SYNONYM_DICTIONARY' not in content:
    # Insert after imports
    content = content.replace("const redisClient = require('../../../db/redis_init');", "const redisClient = require('../../../db/redis_init');" + synonym_map)

# Update getNearbyWorkers to use normalization
old_logic = "const { latitude, longitude, trade_category, radius } = req.query;"
new_logic = """const { latitude, longitude, trade_category, radius } = req.query;
    const { original: queryText, mapped: categoryTag } = normalizeSearchTrade(trade_category);"""

content = content.replace(old_logic, new_logic)

# Replace occurrences of trade_category with a combined search object or update calls
# Since MatchService expects 'trade', we should probably pass both or a smarter string.
# The user said: "Ensure the SQL query looks for this mapped tag alongside the original user keyword"
# So I should update MatchService to accept both or handle it there.

# Actually, I'll pass both to MatchService.
content = content.replace("await MatchService.textSearchWorkers(trade_category)", "await MatchService.textSearchWorkers(queryText, categoryTag)")
content = content.replace("await MatchService.findNearbyWorkers(lat, lon, trade_category, searchRadius)", "await MatchService.findNearbyWorkers(lat, lon, queryText, categoryTag, searchRadius)")
# Update search_params for logging/response
content = content.replace("trade_category,", "trade_category, queryText, categoryTag,")

with open('backend/src/match/controllers/match_controller.js', 'w') as f:
    f.write(content)

with open('backend/src/match/services/match_service.js', 'r') as f:
    service_content = f.read()

# Update textSearchWorkers signature and logic
service_content = service_content.replace(
    "static async textSearchWorkers(query) {",
    "static async textSearchWorkers(query, mappedCategory = null) {"
)

old_text_sql = """        AND (
          $1::TEXT IS NULL OR
          primary_skill ILIKE '%' || $1 || '%' OR
          name ILIKE '%' || $1 || '%'
        )"""

new_text_sql = """        AND (
          $1::TEXT IS NULL OR
          primary_skill ILIKE '%' || $1 || '%' OR
          ($2::TEXT IS NOT NULL AND primary_skill ILIKE '%' || $2 || '%') OR
          name ILIKE '%' || $1 || '%'
        )"""

service_content = service_content.replace(old_text_sql, new_text_sql)
service_content = service_content.replace("await pool.query(sql, [query]);", "await pool.query(sql, [query, mappedCategory]);")

# Update findNearbyWorkers signature and logic
service_content = service_content.replace(
    "static async findNearbyWorkers(lat, lon, trade, radiusKm = 15) {",
    "static async findNearbyWorkers(lat, lon, query, mappedCategory = null, radiusKm = 15) {"
)

# Update Redis search to use mapped category if available?
# The user says "automatically append or set the database search target to match the primary category tag"
# Redis GEORADIUS doesn't filter by category directly, the SQL follow-up does.

# Update Redis SQL follow-up
old_redis_sql = "AND ($4::TEXT IS NULL OR primary_skill ILIKE '%' || $4 || '%')"
new_redis_sql = "AND ($4::TEXT IS NULL OR primary_skill ILIKE '%' || $4 || '%' OR ($5::TEXT IS NOT NULL AND primary_skill ILIKE '%' || $5 || '%'))"
service_content = service_content.replace(old_redis_sql, new_redis_sql)
service_content = service_content.replace("await pool.query(query, [lon, lat, ids, trade]);", "await pool.query(query, [lon, lat, ids, query, mappedCategory]);")

# Update Fallback SQL scan
old_fallback_sql = "AND ($3::TEXT IS NULL OR primary_skill ILIKE '%' || $3 || '%')"
new_fallback_sql = "AND ($3::TEXT IS NULL OR primary_skill ILIKE '%' || $3 || '%' OR ($5::TEXT IS NOT NULL AND primary_skill ILIKE '%' || $5 || '%'))"
service_content = service_content.replace(old_fallback_sql, new_fallback_sql)
service_content = service_content.replace("await pool.query(fallbackQuery, [lon, lat, trade, radiusKm]);", "await pool.query(fallbackQuery, [lon, lat, query, radiusKm, mappedCategory]);")

with open('backend/src/match/services/match_service.js', 'w') as f:
    f.write(service_content)
