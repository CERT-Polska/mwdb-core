import { browserLogin } from "./util";

describe("Login test - mwdb-core", function () {
  it("Login test", function () {
    cy.visit("/");

    browserLogin(Cypress.env("user"), Cypress.env("password"));

    cy.contains("Logout").click();
  });
});
