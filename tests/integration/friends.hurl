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

# Send friend request Alice -> Bob
POST {{base_url}}/api/friends/requests
Authorization: Bearer {{alice_token}}
Content-Type: application/json
{
  "receiverId": {{bob_id}}
}
HTTP 201
[Captures]
request_id: jsonpath "$.id"
[Asserts]
jsonpath "$.sender_id" == {{alice_id}}
jsonpath "$.receiver_id" == {{bob_id}}
jsonpath "$.status" == "PENDING"

# Bob can see incoming request
GET {{base_url}}/api/friends/requests/received
Authorization: Bearer {{bob_token}}
HTTP 200
[Asserts]
jsonpath "$[0].id" == {{request_id}}
jsonpath "$[0].sender_id" == {{alice_id}}
jsonpath "$[0].receiver_id" == {{bob_id}}
jsonpath "$[0].status" == "PENDING"

# Invalid request id should fail
PUT {{base_url}}/api/friends/requests/999999/accept
Authorization: Bearer {{bob_token}}
HTTP 404
[Asserts]
jsonpath "$.error" exists

# Bob accepts request
PUT {{base_url}}/api/friends/requests/{{request_id}}/accept
Authorization: Bearer {{bob_token}}
HTTP 200
[Asserts]
jsonpath "$.id" == {{request_id}}
jsonpath "$.status" == "ACCEPTED"

# Alice friend list includes accepted relation
GET {{base_url}}/api/friends
Authorization: Bearer {{alice_token}}
HTTP 200
[Asserts]
jsonpath "$[0].id" == {{request_id}}
jsonpath "$[0].status" == "ACCEPTED"

# Friendship check confirms relationship
GET {{base_url}}/api/friends/check?userId1={{alice_id}}&userId2={{bob_id}}
Authorization: Bearer {{alice_token}}
HTTP 200
[Asserts]
jsonpath "$.isFriend" == true
