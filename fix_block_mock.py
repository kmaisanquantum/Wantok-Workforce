import re

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# Fix the doubled "const"
content = content.replace("const isNotAdmin = const isNotAdmin =", "const isNotAdmin =")
content = content.replace("const isNotGeneralTrade = const isNotGeneralTrade =", "const isNotGeneralTrade =")

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
