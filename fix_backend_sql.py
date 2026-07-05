import sys

with open('backend/src/match/services/match_service.js', 'r') as f:
    content = f.read()

# Add phone_number to SELECT in textSearchWorkers
content = content.replace(
    'u.id, u.name, u.primary_skill, u.location_name, u.is_verified, u.hourly_rate, u.role, u.bio,',
    'u.id, u.name, u.phone_number, u.email, u.primary_skill, u.location_name, u.is_verified, u.hourly_rate, u.role, u.bio,'
)

# Add phone_number to SELECT in findNearbyWorkers (the previous replace might have caught both if they are identical, but let's check)
# The strings are identical in both functions.

with open('backend/src/match/services/match_service.js', 'w') as f:
    f.write(content)
