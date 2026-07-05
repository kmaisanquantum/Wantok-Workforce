import sys

with open('backend/server.js', 'r') as f:
    lines = f.readlines()

# 1. Add import
import_line = "const messageRoutes = require('./src/match/routes/message_routes');\n"
insert_idx = -1
for i, line in enumerate(lines):
    if "const providerRoutes" in line:
        insert_idx = i + 1
        break
if insert_idx != -1:
    lines.insert(insert_idx, import_line)

# 2. Add app.use
use_line = "app.use('/api/messages', messageRoutes);\n"
use_idx = -1
for i, line in enumerate(lines):
    if "app.use('/api/v1/providers', providerRoutes);" in line:
        use_idx = i + 1
        break
if use_idx != -1:
    lines.insert(use_idx, use_line)

with open('backend/server.js', 'w') as f:
    f.writelines(lines)
