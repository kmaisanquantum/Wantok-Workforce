import sys

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# I see <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{}</Text>
# This likely happened because of the bad substitution in previous attempt

old_tag = '<Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{}</Text>'
new_tag = '<Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{`${getDynamicGreeting()}${customerFirstName ? `, ${customerFirstName}` : "" } 👋`}</Text>'

content = content.replace(old_tag, new_tag)

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
