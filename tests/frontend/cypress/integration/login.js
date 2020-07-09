describe("Login test - Malwarecage", function () {
  it("Login test", function () {
    cy.visit("http://malwarefront:80");

    cy.url().should("include", "/login");

    cy.get("input[name=login]")
      .type("admin")
      .should("have.value", "admin");

    cy.get("input[name=password]")
      .type(Cypress.env("admin_password"))
      .should("have.value", Cypress.env("admin_password"));

    cy.contains("Submit").click();
    cy.contains("Logged as: admin");

    cy.contains("Logout").click();
  });
});
