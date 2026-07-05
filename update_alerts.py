import sys
import re

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# 1. Add customAlert state to App
app_start = re.search(r'export default function App\(\) \{', content)
if app_start:
    insertion_pos = app_start.end()
    state_code = '\n  const [customAlert, setCustomAlert] = useState({ visible: false, message: "" });\n'
    # Check if we should insert a helper function too
    helper_code = '  const showAlert = (message) => setCustomAlert({ visible: true, message });\n'
    content = content[:insertion_pos] + state_code + helper_code + content[insertion_pos:]

# 2. Add Modal UI before </SafeAreaView>
modal_ui = """
      {customAlert.visible && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 1000 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, maxWidth: 350, width: '100%', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0B5932', marginBottom: 8, textAlign: 'center' }}>WANTOK WORKFORCE</Text>
            <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 24, textAlign: 'center', lineHeight: 20 }}>{customAlert.message}</Text>
            <TouchableOpacity
              onPress={() => setCustomAlert({ visible: false, message: "" })}
              style={{ backgroundColor: '#0B5932', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
"""
content = content.replace('    </SafeAreaView>', modal_ui + '    </SafeAreaView>')

# 3. Pass showAlert to components
# This is tricky, I'll use a regex to find component calls and add showAlert={showAlert}
# HomeScreen
content = content.replace('onNavigate={navigate}', 'onNavigate={navigate} showAlert={showAlert}')
# AdminScreen
content = content.replace('onLogout={handleLogout}', 'onLogout={handleLogout} showAlert={showAlert}')
# CreateBookingScreen, BookingsScreen, TrustScreen, AuthScreen, AdminAuthScreen, ProviderOnboardingScreen, ProfileScreen
content = content.replace('user={user}', 'user={user} showAlert={showAlert}')
content = content.replace('onAuth={onAuth}', 'onAuth={onAuth} showAlert={showAlert}') # this might be wrong if it's the prop name in the definition
# Actually, I should just replace 'alert(' with 'showAlert(' everywhere if I can ensure it's available.
# Since I'm passing it as a prop, I need to update the function signatures too.

screens = [
    'HomeScreen', 'AdminScreen', 'CreateBookingScreen', 'BookingsScreen', 'TrustScreen',
    'AuthScreen', 'AdminAuthScreen', 'ProviderOnboardingScreen', 'ProfileScreen',
    'RoleSelectionScreen', 'WorkerDetailScreen'
]

for screen in screens:
    # Match function HomeScreen({ ... })
    pattern = r'function ' + screen + r'\(\{ ([^)]+) \}\)'
    content = re.sub(pattern, r'function ' + screen + r'({ \1, showAlert })', content)

# Special case for those without existing props or slightly different format
# If it doesn't match above, try adding it
# function TrustScreen({ onNavigate })
# content = content.replace('function TrustScreen({ onNavigate })', 'function TrustScreen({ onNavigate, showAlert })')

# Replace all alert(...) with showAlert(...)
# But only if it's a standalone call or in a simple expression
content = content.replace('alert(', 'showAlert(')

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
