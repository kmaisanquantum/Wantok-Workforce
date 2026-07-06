import sys
content = open('backend/src/match/controllers/message_controller.js').read()
old = """      const sql = `
        SELECT DISTINCT ON (m.provider_id, other_party_id)
          m.provider_id,
          CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as other_party_id,
          u.name as other_party_name,
          m.text as last_message,
          m.created_at as last_message_time
        FROM messages m
        JOIN users u ON (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END) = u.id
        WHERE m.sender_id = $1 OR m.receiver_id = $1
        ORDER BY m.provider_id, other_party_id, m.created_at DESC
      `;"""
new = """      const sql = `
        SELECT DISTINCT ON (m.provider_id, other_party_id)
          m.provider_id,
          CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as other_party_id,
          u.name as other_party_name,
          u.primary_skill as other_party_category,
          m.text as last_message,
          m.created_at as last_message_time
        FROM messages m
        JOIN users u ON (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END) = u.id
        WHERE m.sender_id = $1 OR m.receiver_id = $1
        ORDER BY m.provider_id, other_party_id, m.created_at DESC
      `;"""
if old in content:
    open('backend/src/match/controllers/message_controller.js', 'w').write(content.replace(old, new))
    print("Backend getInbox updated")
else:
    print("Backend getInbox NOT found")
