import sys
content = open('WantokWorkforce.js').read()
old = """      case "messages":
        return <ProviderInboxScreen user={user} showAlert={showAlert} />;"""
new = """      case "messages":
        if (currentUser === 'provider') return <ProviderInboxScreen user={user} showAlert={showAlert} />;
        return <CustomerInboxScreen user={user} showAlert={showAlert} />;"""
if old in content:
    open('WantokWorkforce.js', 'w').write(content.replace(old, new))
    print("renderScreen updated")
else:
    print("renderScreen NOT found")
