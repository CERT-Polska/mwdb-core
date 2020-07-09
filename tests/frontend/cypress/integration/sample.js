describe("Sample view test - Malwarecage", function () {
  it("Sample view test - existent and non-existent md5 and sha256 hashes", function () {
    cy.request("POST", "http://malwarefront:80/api/auth/login", {
      login: "admin",
      password: Cypress.env("admin_password"),
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property("token");
      cy.wrap(response.body.token).as("token");
    });

    cy.get("@token").then((token) => {
      cy.request({
        method: "POST",
        url: "http://malwarefront:80/api/file/root",
        body: {
          files: { file: ("file1", "hello") },
        },
        headers: {
          Authorization: " Bearer " + token,
          "content-type": "multipart/form-data",
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });
  });
});
