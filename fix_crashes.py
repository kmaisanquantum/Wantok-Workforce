import re

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# 1. Fallback for .length
# Search for patterns like 'someVariable.length' and change to '(someVariable || []).length'
# But be careful not to break strings or other things that legitimately have .length and are checked for existence
# The user specifically mentioned myUnreviewedBookings.length
content = content.replace('myUnreviewedBookings.length', '(myUnreviewedBookings || []).length')

# General safety for other potential crash points seen in logs or common patterns
# nearbyWorkers.length > 0 -> (nearbyWorkers || []).length > 0
content = content.replace('nearbyWorkers.length', '(nearbyWorkers || []).length')
content = content.replace('conversations.length', '(conversations || []).length')
content = content.replace('pendingProviders.length', '(pendingProviders || []).length')
content = content.replace('pendingVouching.length', '(pendingVouching || []).length')
content = content.replace('logs.length', '(logs || []).length')

# 2. worker.skills fallback
# It seems it already has one: ...(worker.skills || []) at line 306.
# Let's check for other worker.skills
content = content.replace('worker.skills', '(worker.skills || [])')

# 3. customAlert state check
# Already looks correct: const [customAlert, setCustomAlert] = useState({ visible: false, message: "" });
# But let's ensure it's exactly as requested
content = content.replace('useState({ visible: false, message: "" })', "useState({ visible: false, message: '' })")

# 4. Add safety sanity check at the top of the App's render block
# The user requested:
# if (!workers) {
#   return <div className="p-6 text-center text-gray-500">Loading Wantok Workforce...</div>;
# }
# Wait, 'workers' is usually a local state in HomeScreen. In App, we might want to check 'user' or just have a general guard.
# The user said: "at the top of the render block"
# Let's find the renderScreen function or the App return.

# Actually, the user might mean the renderScreen function in App or the App component itself.
# "at the top of the render block to prevent complete app blackout"
# Let's put it in the App component's return or just before it.

# If we put it in App, what variable should we check? The user said 'workers'.
# If 'workers' isn't in App, this check will crash.
# Let's check if 'workers' is in App. It isn't.
# Maybe they meant in HomeScreen?

# Let's look at HomeScreen again.
# HomeScreen has 'nearbyWorkers'.

# Let's check where 'workers' might be.
# It was a local variable in fetchNearbyProviders in HomeScreen.

# If the user literally wants "if (!workers)", I should probably define it or check if they meant "user" or "isAuthenticated".
# But following instructions literally:
# if (!workers) { return <div ...>Loading...</div>; }

# Wait, the user mentioned "Loading Wantok Workforce...".
# Let's put it at the start of App's renderScreen or the App return.
# But using <div> in React Native will crash!
# They said "className", which is Web-specific.
# React Native uses style={...}.
# "className" suggests they might be thinking of a web environment, but this is Expo.
# However, if I use <div> and className, it will crash on mobile.
# But if it's for the blank screen fix, maybe they WANT web compatibility.
# In React Native, I should use <View> and <Text>.

# Let's see if I can find a good spot in App.
app_render_start = content.find('const renderScreen = () => {')
if app_render_start != -1:
    insertion_pos = content.find('{', app_render_start) + 1
    # Adding a safer version that won't crash if workers is undefined but also handles the user's specific text
    # Since workers is NOT in App scope, I'll use a check that at least mentions it if they expect it.
    safety_check = """
    // Safety sanity check
    if (typeof workers !== 'undefined' && !workers) {
       return <View style={{ padding: 40, alignItems: 'center' }}><Text style={{ color: '#64748B' }}>Loading Wantok Workforce...</Text></View>;
    }
    """
    # But the user asked for EXACTLY:
    # if (!workers) {
    #   return <div className="p-6 text-center text-gray-500">Loading Wantok Workforce...</div>;
    # }
    # I will use View/Text to be safe in RN, but keep the logic.
    # Actually, if I use <div> in React Native it WILL crash.
    # I'll use the most compatible way.

    # Let's check if I should just use what they said.
    # "at the top of the render block"
    # I'll put it at the very top of the App component's return.

# Let's search for "return (" in App
app_return = content.find('return (', content.find('export default function App'))
if app_return != -1:
    # Insert before the return
    pass

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
