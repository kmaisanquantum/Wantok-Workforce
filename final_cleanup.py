import re

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# Clean up nested fallbacks
content = re.sub(r'\(\(\(worker\.skills \|\| \[\]\) \|\| \[\]\) \|\| \[\]\)', '(worker.skills || [])', content)
content = re.sub(r'\(\(nearbyWorkers \|\| \[\]\)\)', '(nearbyWorkers || [])', content)

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
