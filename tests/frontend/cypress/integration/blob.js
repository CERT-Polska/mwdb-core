describe("Blob test - Malwarecage", function () {
  it("Blob test", function () {
    cy.request("POST", "http://malwarefront:80/api/auth/login", {
      login: "admin",
      password: Cypress.env("admin_password"),
    }).then((response) => {
      expect(response.body).to.have.property("token");
      cy.wrap(response.body.token).as("token");
    });

    cy.get("@token").then((token) => {
      cy.request({
        method: "PUT",
        url: "http://malwarefront:80/api/blob/root",
        body: {
          blob_name: "some.blob",
          blob_type: "inject",
          content: "TEST",
        },
        headers: {
          Authorization: " Bearer " + token,
        },
      });
    });

    cy.visit("http://malwarefront:80");

    cy.url().should("include", "/login");

    cy.get(":nth-child(1) > .form-control")
      .type("admin")
      .should("have.value", "admin");

    cy.get(":nth-child(2) > .form-control")
      .type(Cypress.env("admin_password"))
      .should("have.value", Cypress.env("admin_password"));

    cy.contains("Submit").click();
    cy.contains("Logged as: admin");

    cy.contains("Recent blobs").click();
    cy.contains("some.blob");

    cy.contains("Logout").click();
  });
});
