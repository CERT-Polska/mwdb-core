import { browserLogin } from "./util";

describe("Login test - Malwarecage", function () {
  it("Login test", function () {
    cy.visit("/");

    browserLogin(Cypress.env("user"), Cypress.env("password"));

    cy.contains("Logout").click();
  });
});
