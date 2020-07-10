import { browser_login } from "./util";

describe("Login test - Malwarecage", function () {
  it("Login test", function () {
    cy.visit("/");

    browser_login(Cypress.env("user"), Cypress.env("password"));

    cy.contains("Logout").click();
  });
});
