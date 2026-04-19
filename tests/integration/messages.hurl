# Login fixed integration users
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
bob_token: jsonpath "$.token"
bob_id: jsonpath "$.user.id"

POST {{base_url}}/api/auth/login
Content-Type: application/json
{
  "email": "charlie.integration@example.com",
  "password": "secret123"
}
HTTP 200
[Captures]
charlie_id: jsonpath "$.user.id"

# Send message between friends (Alice -> Bob)
POST {{base_url}}/api/messages
Authorization: Bearer {{alice_token}}
Content-Type: application/json
{
  "receiverId": {{bob_id}},
  "content": "hurl-msg-hello-bob"
}
HTTP 201
[Captures]
message_id: jsonpath "$.id"
[Asserts]
jsonpath "$.sender_id" == {{alice_id}}
jsonpath "$.receiver_id" == {{bob_id}}
jsonpath "$.content" == "hurl-msg-hello-bob"

# Sending to a non-friend should fail
POST {{base_url}}/api/messages
Authorization: Bearer {{alice_token}}
Content-Type: application/json
{
  "receiverId": {{charlie_id}},
  "content": "this should fail"
}
HTTP 403
[Asserts]
jsonpath "$.error" exists

# Conversation history should include our sent message
GET {{base_url}}/api/messages/{{bob_id}}
Authorization: Bearer {{alice_token}}
HTTP 200
[Asserts]
body contains "hurl-msg-hello-bob"
