import re

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# Define the modal block to remove
modal_block_pattern = r'\s*<Modal visible=\{isChatVisible\} animationType="slide" transparent=\{true\}>.*?</Modal>'

# We want to keep it ONLY in WorkerDetailScreen
# Let's split the file by function definitions to be precise
functions = re.split(r'(function \w+\(.*?\)\s*\{)', content)

new_content_parts = []
in_worker_detail = False

for i in range(len(functions)):
    part = functions[i]
    if 'function WorkerDetailScreen' in part:
        in_worker_detail = True
    elif i > 0 and functions[i-1].startswith('function ') and 'function WorkerDetailScreen' not in functions[i-1]:
        in_worker_detail = False

    if not in_worker_detail:
        # Remove the modal block if it exists in this part
        part = re.sub(modal_block_pattern, '', part, flags=re.DOTALL)

    new_content_parts.append(part)

content = "".join(new_content_parts)

# Also fix the <div> safety check to use View/Text for RN compatibility
# but keep the requested text
safety_block_pattern = r'if \(!workers \|\| !Array\.isArray\(workers\)\) \{.*?return \(.*?<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">.*?<div className="text-center">.*?<p className="text-gray-500 font-medium">(.*?)</p>.*?</div>.*?</div>.*?\);.*?\}'
replacement_safety = r"""  if (!workers || !Array.isArray(workers)) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#6B7280', fontWeight: '500' }}>\1</Text>
        </View>
      </View>
    );
  }"""

content = re.sub(safety_block_pattern, replacement_safety, content, flags=re.DOTALL)

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
