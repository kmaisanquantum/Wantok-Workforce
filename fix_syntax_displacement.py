import re

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# Remove the incorrectly placed safety check
wrong_check = """
  if (typeof workers !== 'undefined' && !workers) {
    return <div className="p-6 text-center text-gray-500">Loading Wantok Workforce...</div>;
  }

  return ("""

# Actually, the replacement might have messed up the switch case for "profile"
# Let's see the context around "case 'profile':"
# case "profile":
#   if ...
#   return (
#     <ProfileScreen ...

# We need to fix the case statement.
# case "profile":
#   return <ProfileScreen ... />;

# Let's find the App component's return block again.
app_func_pattern = r'export default function App\(\) \{'
app_match = re.search(app_func_pattern, content)
if app_match:
    # Find the main return ( <SafeAreaView ...
    main_return = re.search(r'return \(\s+<SafeAreaView', content)
    if main_return:
        insertion_pos = main_return.start()
        safety_logic = """
  if (typeof workers !== 'undefined' && !workers) {
    return <div className="p-6 text-center text-gray-500">Loading Wantok Workforce...</div>;
  }
"""
        # First, clean up the displaced one
        content = content.replace("""
  if (typeof workers !== 'undefined' && !workers) {
    return <div className="p-6 text-center text-gray-500">Loading Wantok Workforce...</div>;
  }

  return (""", "        return (")

        # Now insert it correctly
        content = content[:insertion_pos] + safety_logic + "\n" + content[insertion_pos:]

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
