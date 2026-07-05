import re

with open('WantokWorkforce.js', 'r') as f:
    content = f.read()

# Fix the double question mark syntax error
content = content.replace('??.length', '?.length')

# Also ensure (myUnreviewedBookings || []).length is used instead of optional chaining if requested
content = content.replace('myUnreviewedBookings?.length', '(myUnreviewedBookings || []).length')
content = content.replace('nearbyWorkers?.length', '(nearbyWorkers || []).length')
content = content.replace('conversations?.length', '(conversations || []).length')
content = content.replace('pendingProviders?.length', '(pendingProviders || []).length')
content = content.replace('pendingVouching?.length', '(pendingVouching || []).length')
content = content.replace('logs?.length', '(logs || []).length')

# Also fix case where it might be (nearbyWorkers || [])?.length
content = content.replace('(nearbyWorkers || [])?.length', '(nearbyWorkers || []).length')

with open('WantokWorkforce.js', 'w') as f:
    f.write(content)
