import re

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# 1. Clean up previous safety check attempts to avoid duplication or displacement
content = re.sub(r'if \(typeof workers !== \'undefined\' && !workers\) \{.*?\n\s*\}', '', content, flags=re.DOTALL)
content = re.sub(r'// Global safety check.*?\n\s*if \(typeof workers !== \'undefined\' && !workers\) \{.*?\n\s*\}', '', content, flags=re.DOTALL)

# 2. Ensure customAlert is initialized strictly at the top of App
app_pattern = r'export default function App\(\) \{'
app_match = re.search(app_pattern, content)
if app_match:
    # Remove existing customAlert/showAlert if any to re-insert cleanly
    content = re.sub(r'const \[customAlert, setCustomAlert\] = useState\(.*?\);\s*', '', content)
    content = re.sub(r'const showAlert = \(message\) => setCustomAlert\(.*?\);\s*', '', content)

    insertion_pos = app_match.end()
    state_init = "\n  const [customAlert, setCustomAlert] = useState({ visible: false, message: '' });\n  const showAlert = (message) => setCustomAlert({ visible: true, message });\n"

    # Also define workers at the top of App to satisfy the safety check
    workers_init = "  const [workers, setWorkers] = useState([]);\n"

    content = content[:insertion_pos] + state_init + workers_init + content[insertion_pos:]

# 3. Add the safety check before the main return of App
safety_check = """
  if (!workers || !Array.isArray(workers)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 font-medium">Loading Wantok Workforce profiles safely...</p>
        </div>
      </div>
    );
  }
"""

# Find the main return of App
# We look for the final return ( <SafeAreaView ... )
main_return_pattern = r'return \(\s+<SafeAreaView'
main_return_match = re.search(main_return_pattern, content)
if main_return_match:
    insertion_pos = main_return_match.start()
    content = content[:insertion_pos] + safety_check + "\n  " + content[insertion_pos:]

# 4. Final syntax check - ensure no hanging fragments from previous edits
# Check for common corruption patterns
content = re.sub(r'StatusBar barStyle="light-content" backgroundColor=\{COLORS\.stat\n\s*usBar\}', 'StatusBar barStyle="light-content" backgroundColor={COLORS.statusBar}', content)

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
