import sys

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

content = content.replace('return <WorkerDetailScreen worker={screenData} onNavigate={navigate} showAlert={showAlert} />;', 'return <WorkerDetailScreen worker={screenData} onNavigate={navigate} showAlert={showAlert} user={user} />;')

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
