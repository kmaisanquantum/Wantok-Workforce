import re

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# 1. CLEAN UP ALL MESSES FIRST
# Remove any misplaced 'if (typeof workers...' blocks
content = re.sub(r'\n\s*if \(typeof workers !== \'undefined\' && !workers\) \{.*?\n\s*\}', '', content, flags=re.DOTALL)

# Fix the broken StatusBar line
content = re.sub(r'StatusBar barStyle="light-content" backgroundColor=\{COLORS\.stat\n\s*usBar\}', 'StatusBar barStyle="light-content" backgroundColor={COLORS.statusBar}', content)

# 2. Add customAlert state exactly as requested
content = re.sub(r'const \[customAlert, setCustomAlert\] = useState\(.*?\);', "const [customAlert, setCustomAlert] = useState({ visible: false, message: '' });", content)

# 3. Add .length fallbacks
# These are safer regexes
content = re.sub(r'(?<!\|\| \[\])\.length', '?.length', content) # Use optional chaining as a first step for brevity
# But user specifically asked for (myUnreviewedBookings || []).length
content = content.replace('myUnreviewedBookings?.length', '(myUnreviewedBookings || []).length')
content = content.replace('nearbyWorkers?.length', '(nearbyWorkers || []).length')
content = content.replace('conversations?.length', '(conversations || []).length')
content = content.replace('pendingProviders?.length', '(pendingProviders || []).length')
content = content.replace('pendingVouching?.length', '(pendingVouching || []).length')
content = content.replace('logs?.length', '(logs || []).length')

# Fix worker.skills
content = content.replace('worker.skills', '(worker.skills || [])')
content = content.replace('((worker.skills || []))', '(worker.skills || [])')

# 4. Insert the safety check at the TOP of the render block (renderScreen)
# Actually, the user said "at the top of the render block to prevent complete app blackout".
# If I put it in renderScreen, it will return early for any screen if workers is undefined.
# But workers IS defined in TrustScreen.

# Let's put it at the very beginning of renderScreen in App.
render_screen_match = re.search(r'const renderScreen = \(\) => \{', content)
if render_screen_match:
    insertion_pos = render_screen_match.end()
    safety_block = """
    if (typeof workers !== 'undefined' && !workers) {
      return <div className="p-6 text-center text-gray-500">Loading Wantok Workforce...</div>;
    }
    """
    content = content[:insertion_pos] + safety_block + content[insertion_pos:]

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
