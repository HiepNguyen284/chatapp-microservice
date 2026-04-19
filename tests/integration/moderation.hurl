# Login users (Alice is promoted to ADMIN in CI before this file runs)
POST {{base_url}}/api/auth/login
Content-Type: application/json
{
  "email": "alice.integration@example.com",
  "password": "secret123"
}
HTTP 200
[Captures]
alice_token: jsonpath "$.token"
alice_id: jsonpath "$.user.id"

POST {{base_url}}/api/auth/login
Content-Type: application/json
{
  "email": "bob.integration@example.com",
  "password": "secret123"
}
HTTP 200
[Captures]
bob_id: jsonpath "$.user.id"

# Admin can list banned words
GET {{base_url}}/api/moderation/banned-words
Authorization: Bearer {{alice_token}}
HTTP 200

# Add banned word
POST {{base_url}}/api/moderation/banned-words
Authorization: Bearer {{alice_token}}
Content-Type: application/json
{
  "word": "hurlbadword"
}
HTTP 201
[Captures]
banned_word_id: jsonpath "$.id"
[Asserts]
jsonpath "$.word" == "hurlbadword"

# Verify moderation impacts message content filtering
POST {{base_url}}/api/messages
Authorization: Bearer {{alice_token}}
Content-Type: application/json
{
  "receiverId": {{bob_id}},
  "content": "hello hurlbadword world"
}
HTTP 201
[Asserts]
jsonpath "$.content" == "hello *** world"

# Delete banned word
DELETE {{base_url}}/api/moderation/banned-words/{{banned_word_id}}
Authorization: Bearer {{alice_token}}
HTTP 200
[Asserts]
jsonpath "$.message" == "Banned word removed"
