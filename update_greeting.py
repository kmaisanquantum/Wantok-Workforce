import sys

with open('WantokWorkforce.js', 'r') as f:
    lines = f.readlines()

# 1. Find HomeScreen function
start_home = -1
for i, line in enumerate(lines):
    if 'function HomeScreen' in line:
        start_home = i
        break

if start_home != -1:
    greeting_fn = (
        '  const getDynamicGreeting = () => {\n'
        '    const currentHour = new Date().getHours();\n'
        '    if (currentHour >= 5 && currentHour < 12) return "Good morning";\n'
        '    if (currentHour >= 12 && currentHour < 17) return "Good afternoon";\n'
        '    if (currentHour >= 17 && currentHour < 21) return "Good evening";\n'
        '    return "Good night";\n'
        '  };\n'
        '  const fullCustomerName = user?.name || "";\n'
        '  const customerFirstName = fullCustomerName ? fullCustomerName.split(" ")[0] : "";\n'
    )
    lines.insert(start_home + 1, greeting_fn)

# 2. Update JSX
content = "".join(lines)
old_text = 'Good morning 👋'
new_text = '{`${getDynamicGreeting()}${customerFirstName ? `, ${customerFirstName}` : "" } 👋`}'
content = content.replace(old_text, new_text)

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
