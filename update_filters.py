import re

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# Loop 1: activeProvidersOnly
pattern1 = r"(const activeProvidersOnly = workers\.filter\(worker => \{)\s+(const isNotAdmin = .*?;)\s+(const isNotGeneralTrade = .*?;)\s+(const isNotMockProvider = .*?;)\s+(return isNotAdmin && isNotGeneralTrade && isNotMockProvider;)\s+(\}\);)"
replacement1 = r"\1\n            const isNotAdmin = (worker.role || '').toLowerCase() !== 'admin' && \n                               (worker.role || '').toLowerCase() !== 'master admin' &&\n                               !worker.isAdmin;\n            const isNotGeneralTrade = (worker.category || '').toLowerCase() !== 'general trade';\n            return isNotAdmin && isNotGeneralTrade;\n          });"

# Loop 2: strictShortResults
pattern2 = r"(const strictShortResults = workers\.filter\(worker => \{)\s+(const isNotAdmin = .*?;)\s+(const isNotGeneralTrade = .*?;)\s+(const isNotMockProvider = .*?;)\s+(const matchesSearchCriteria = .*?;)\s+(return isNotAdmin && isNotGeneralTrade && isNotMockProvider && matchesSearchCriteria;)\s+(\}\);)"
replacement2 = r"\1\n            const isNotAdmin = (worker.role || '').toLowerCase() !== 'admin' && \n                               (worker.role || '').toLowerCase() !== 'master admin' &&\n                               !worker.isAdmin;\n            const isNotGeneralTrade = (worker.category || '').toLowerCase() !== 'general trade';\n            const matchesSearchCriteria = (worker.name || '').toLowerCase().startsWith(normalizedInput) ||\n                                  (worker.role || '').toLowerCase().startsWith(normalizedInput) ||\n                                  (worker.category || '').toLowerCase().startsWith(normalizedInput);\n            return isNotAdmin && isNotGeneralTrade && matchesSearchCriteria;\n          });"

# Loop 3: fuzzyResults
pattern3 = r"(const fuzzyResults = workers\.filter\(worker => \{)\s+(const isNotAdmin = .*?;)\s+(const isNotGeneralTrade = .*?;)\s+(const isNotMockProvider = .*?;)\s+(if \(!isNotAdmin \|\| !isNotGeneralTrade \|\| !isNotMockProvider\) return false;)"
replacement3 = r"\1\n            const isNotAdmin = (worker.role || '').toLowerCase() !== 'admin' && \n                               (worker.role || '').toLowerCase() !== 'master admin' &&\n                               !worker.isAdmin;\n            const isNotGeneralTrade = (worker.category || '').toLowerCase() !== 'general trade';\n            if (!isNotAdmin || !isNotGeneralTrade) return false;"

content = re.sub(pattern1, replacement1, content, flags=re.DOTALL)
content = re.sub(pattern2, replacement2, content, flags=re.DOTALL)
content = re.sub(pattern3, replacement3, content, flags=re.DOTALL)

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
