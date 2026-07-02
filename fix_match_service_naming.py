import sys

with open('backend/src/match/services/match_service.js', 'r') as f:
    content = f.read()

# Fix naming conflict: 'query' variable used for both SQL string and search text
content = content.replace(
    'const query = `',
    'const sqlQuery = `'
).replace(
    'await pool.query(query, [lon, lat, ids, query, mappedCategory]);',
    'await pool.query(sqlQuery, [lon, lat, ids, query, mappedCategory]);'
)

with open('backend/src/match/services/match_service.js', 'w') as f:
    f.write(content)
