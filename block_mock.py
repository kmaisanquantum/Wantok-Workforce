import re

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# Pattern for filter loops
mock_check = "            const isNotMockProvider = (worker.name || '').toLowerCase().trim() !== 'mock provider';"

# 1. activeProvidersOnly loop
content = re.sub(
    r"(const activeProvidersOnly = workers\?\.filter\(worker => \{)\s+(const isNotAdmin = .*?;)\s+(const isNotGeneralTrade = .*?;)\s+(return isNotAdmin && isNotGeneralTrade;)",
    r"\1\n            const isNotAdmin = \2\n            const isNotGeneralTrade = \3\n            const isNotMockProvider = (worker.name || '').toLowerCase().trim() !== 'mock provider';\n            return isNotAdmin && isNotGeneralTrade && isNotMockProvider;",
    content, flags=re.DOTALL
)

# 2. strictShortResults loop
content = re.sub(
    r"(const strictShortResults = workers\?\.filter\(worker => \{)\s+(const isNotAdmin = .*?;)\s+(const isNotGeneralTrade = .*?;)\s+(const matchesSearchCriteria = .*?;)\s+(return isNotAdmin && isNotGeneralTrade && matchesSearchCriteria;)",
    r"\1\n            const isNotAdmin = \2\n            const isNotGeneralTrade = \3\n            const isNotMockProvider = (worker.name || '').toLowerCase().trim() !== 'mock provider';\n            \4\n            return isNotAdmin && isNotGeneralTrade && isNotMockProvider && matchesSearchCriteria;",
    content, flags=re.DOTALL
)

# 3. fuzzyResults loop
content = re.sub(
    r"(const fuzzyResults = workers\?\.filter\(worker => \{)\s+(const isNotAdmin = .*?;)\s+(const isNotGeneralTrade = .*?;)\s+(if \(!isNotAdmin \|\| !isNotGeneralTrade\) return false;)",
    r"\1\n            const isNotAdmin = \2\n            const isNotGeneralTrade = \3\n            const isNotMockProvider = (worker.name || '').toLowerCase().trim() !== 'mock provider';\n            if (!isNotAdmin || !isNotGeneralTrade || !isNotMockProvider) return false;",
    content, flags=re.DOTALL
)

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
