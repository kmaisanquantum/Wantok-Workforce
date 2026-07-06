import sys
content = open('WantokWorkforce.js').read()
old = """const NAV_ITEMS = [
  { key: "home", label: "Home", icon: "🏠" },
  { key: "booking", label: "Bookings", icon: "📅" },
  { key: "trust", label: "Trust", icon: "🛡️" },
  { key: "profile", label: "Profile", icon: "👤" },
];"""
new = """const NAV_ITEMS = [
  { key: "home", label: "Home", icon: "🏠" },
  { key: "booking", label: "Bookings", icon: "📅" },
  { key: "messages", label: "Inbox", icon: "💬" },
  { key: "trust", label: "Trust", icon: "🛡️" },
  { key: "profile", label: "Profile", icon: "👤" },
];"""
if old in content:
    open('WantokWorkforce.js', 'w').write(content.replace(old, new))
    print("NAV_ITEMS updated")
else:
    print("NAV_ITEMS NOT found")
