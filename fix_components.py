import sys
import re

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# Fix sub-components that didn't get showAlert in their definition
components = ['ProviderVouchingForm', 'ProviderFinancialDashboard']
for comp in components:
    pattern = r'function ' + comp + r'\(\{ ([^)]+) \}\)'
    content = re.sub(pattern, r'function ' + comp + r'({ \1, showAlert })', content)

# Clean up double showAlert={showAlert} in calls
content = re.sub(r'showAlert=\{showAlert\} showAlert=\{showAlert\}', 'showAlert={showAlert}', content)

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
