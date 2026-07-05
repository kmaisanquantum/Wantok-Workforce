import sys

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# Fix calls in renderScreen
content = content.replace('<AdminAuthScreen onAuth=', '<AdminAuthScreen showAlert={showAlert} onAuth=')
content = content.replace('return <AuthScreen onAuth={handleAuth} />;', 'return <AuthScreen showAlert={showAlert} onAuth={handleAuth} />;')
content = content.replace('return <RoleSelectionScreen onSelectRole=', 'return <RoleSelectionScreen showAlert={showAlert} onSelectRole=')

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
