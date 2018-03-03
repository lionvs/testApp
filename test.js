var qs = require('qs');

var testObj = {"payloads":[{"userID":14,"requestBody":{"age":30}},{"userID":29,"requestBody":{"age":30}},{"userID":103,"requestBody":{"age":30}}],"endpoint":{"batch":"PATCH","url":"https://guesty-user-service.herokuapp.com/user/{userId}"}}


var str = qs.stringify(testObj);

console.log(str);