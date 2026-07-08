import sys

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# 1. Update ProfileScreen signature to accept isDesktop
content = content.replace(
    'function ProfileScreen({ onNavigate, currentUser, onLogout, user, onUpdateUser, showAlert }) {',
    'function ProfileScreen({ onNavigate, currentUser, onLogout, user, onUpdateUser, showAlert, isDesktop }) {'
)

# 2. Update renderScreen to pass isDesktop to ProfileScreen
# I'll look for the profile case in renderScreen
old_profile_case = """      case "profile":
        return (
          <ProfileScreen
            onNavigate={navigate} showAlert={showAlert}
            currentUser={currentUser}

            onLogout={handleLogout} showAlert={showAlert}
            user={user} showAlert={showAlert}
            onUpdateUser={(updated) => setUser(updated)}
          />
        );"""

new_profile_case = """      case "profile":
        return (
          <ProfileScreen
            onNavigate={navigate} showAlert={showAlert}
            currentUser={currentUser}
            isDesktop={isDesktop}
            onLogout={handleLogout} showAlert={showAlert}
            user={user} showAlert={showAlert}
            onUpdateUser={(updated) => setUser(updated)}
          />
        );"""

content = content.replace(old_profile_case, new_profile_case)

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
