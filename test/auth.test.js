const authenticated = require("../middleware/isAuth");
const jwt = require("jsonwebtoken");
const sinon = require("sinon");

test("should throw an error", () => {
  const req = {
    get: (field) => {
      return null;
    },
  };

  try {
    authenticated(req, {}, () => {});
  } catch (err) {
    expect(err).toEqual(new Error("Not authenticated"));
  }
});

test("should return an request with valid token", () => {
  const req = {
    get: (field) => {
      return "Bearer daosdjaksdmgfwom";
    },
  };

  sinon.stub(jwt, "verify");
  jwt.verify.returns({ userId: "312312fsfsf" });

  authenticated(req, {}, () => {});
  expect(req).toHaveProperty("userId");

  jwt.verify.restore();
});

test("should return an token error", () => {
  const req = {
    get: (field) => {
      return "Bearer daosdjaksdmgfwom";
    },
  };

  expect(() => {
    authenticated(req, {}, () => {});
  }).toThrowError();
});
