# Register users for integration flows
POST {{base_url}}/api/auth/register
Content-Type: application/json
{
  "username": "hurl_alice",
  "email": "alice.integration@example.com",
  "password": "secret123"
}
HTTP 201
[Captures]
alice_id: jsonpath "$.id"
[Asserts]
jsonpath "$.username" == "hurl_alice"
jsonpath "$.email" == "alice.integration@example.com"
jsonpath "$.role" == "USER"

POST {{base_url}}/api/auth/register
Content-Type: application/json
{
  "username": "hurl_bob",
  "email": "bob.integration@example.com",
  "password": "secret123"
}
HTTP 201
[Captures]
bob_id: jsonpath "$.id"
[Asserts]
jsonpath "$.username" == "hurl_bob"
jsonpath "$.email" == "bob.integration@example.com"

POST {{base_url}}/api/auth/register
Content-Type: application/json
{
  "username": "hurl_charlie",
  "email": "charlie.integration@example.com",
  "password": "secret123"
}
HTTP 201
[Captures]
charlie_id: jsonpath "$.id"
[Asserts]
jsonpath "$.username" == "hurl_charlie"
jsonpath "$.email" == "charlie.integration@example.com"

# Duplicate register should fail
POST {{base_url}}/api/auth/register
Content-Type: application/json
{
  "username": "hurl_alice",
  "email": "alice.integration@example.com",
  "password": "secret123"
}
HTTP 409
[Asserts]
jsonpath "$.error" exists

# Login happy path
POST {{base_url}}/api/auth/login
Content-Type: application/json
{
  "email": "alice.integration@example.com",
  "password": "secret123"
}
HTTP 200
[Captures]
alice_token: jsonpath "$.token"
[Asserts]
jsonpath "$.user.id" == {{alice_id}}
jsonpath "$.user.email" == "alice.integration@example.com"
jsonpath "$.token" exists

# Login invalid password should fail
POST {{base_url}}/api/auth/login
Content-Type: application/json
{
  "email": "alice.integration@example.com",
  "password": "wrong-password"
}
HTTP 401
[Asserts]
jsonpath "$.error" exists

# Login other users (used by downstream integration tests)
POST {{base_url}}/api/auth/login
Content-Type: application/json
{
  "email": "bob.integration@example.com",
  "password": "secret123"
}
HTTP 200
[Captures]
bob_token: jsonpath "$.token"
[Asserts]
jsonpath "$.user.id" == {{bob_id}}

POST {{base_url}}/api/auth/login
Content-Type: application/json
{
  "email": "charlie.integration@example.com",
  "password": "secret123"
}
HTTP 200
[Captures]
charlie_token: jsonpath "$.token"
[Asserts]
jsonpath "$.user.id" == {{charlie_id}}
