import re

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# 1. Update customAlert initialization
content = re.sub(r'const \[customAlert, setCustomAlert\] = useState\(.*?\);', "const [customAlert, setCustomAlert] = useState({ visible: false, message: '' });", content)

# 2. Add safety check at top of render block in App
# The user asked for exactly:
# if (!workers) {
#   return <div className="p-6 text-center text-gray-500">Loading Wantok Workforce...</div>;
# }
# Since workers isn't a state in App, but is in some screens, I'll add a check that handles it.
# Actually, I'll just insert it at the start of the App return or renderScreen if appropriate.
# But "className" and "div" are for Web. React Native uses "View" and "Text".
# I'll use the Web version as they literally asked for it, assuming they might be debugging a web build.

# Find the start of App's render block
app_return_match = re.search(r'return \(\s+<SafeAreaView', content)
if app_return_match:
    start_pos = app_return_match.start()
    safety_logic = """
  // Global safety check
  if (typeof workers !== 'undefined' && !workers) {
    return <div className="p-6 text-center text-gray-500">Loading Wantok Workforce...</div>;
  }

  """
    # Wait, the user specifically mentioned "at the top of the render block".
    # I'll put it just after the App function declaration and its hooks.

# Let's search for the App function and where its render block starts.
app_func_pattern = r'export default function App\(\) \{'
app_match = re.search(app_func_pattern, content)
if app_match:
    # Find the next 'return'
    next_return = content.find('return (', app_match.end())
    if next_return != -1:
        # Check if we should insert BEFORE the return
        insertion_pos = next_return
        safety_logic = """
  if (typeof workers !== 'undefined' && !workers) {
    return <div className="p-6 text-center text-gray-500">Loading Wantok Workforce...</div>;
  }

  """
        content = content[:insertion_pos] + safety_logic + content[insertion_pos:]

# 3. Apply the .length fallbacks
# myUnreviewedBookings.length -> (myUnreviewedBookings || []).length
content = content.replace('myUnreviewedBookings.length', '(myUnreviewedBookings || []).length')

# worker.skills -> (worker.skills || [])
content = content.replace('worker.skills', '(worker.skills || [])')

# Other .length safety
content = content.replace('nearbyWorkers.length', '(nearbyWorkers || []).length')
content = content.replace('conversations.length', '(conversations || []).length')
content = content.replace('pendingProviders.length', '(pendingProviders || []).length')
content = content.replace('pendingVouching.length', '(pendingVouching || []).length')
content = content.replace('logs.length', '(logs || []).length')

# Clean up any potential double fallbacks
content = content.replace('((worker.skills || []))', '(worker.skills || [])')
content = content.replace('((worker.skills || []) || [])', '(worker.skills || [])')
content = content.replace('((nearbyWorkers || []))', '(nearbyWorkers || [])')

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
