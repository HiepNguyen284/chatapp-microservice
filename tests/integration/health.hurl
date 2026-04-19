GET {{base_url}}/health/user
HTTP 200
[Asserts]
jsonpath "$.status" == "ok"

GET {{base_url}}/health/friend
HTTP 200
[Asserts]
jsonpath "$.status" == "ok"

GET {{base_url}}/health/message
HTTP 200
[Asserts]
jsonpath "$.status" == "ok"
