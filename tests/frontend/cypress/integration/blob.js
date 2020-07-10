import { request_login } from "./util";
import { browser_login } from "./util";

describe("Blob view test - Malwarecage", function () {
  it("Blob view test - existent and non-existent hash", function () {
    request_login(Cypress.env("user"), Cypress.env("password"));

    cy.get("@token").then((token) => {
      cy.request({
        method: "PUT",
        url: "/api/blob/root",
        body: {
          blob_name: "some.blob",
          blob_type: "inject",
          content: "TEST",
        },
        headers: {
          Authorization: " Bearer " + token,
        },
      }).then((response) => {
        cy.wrap(response.body.id).as("blob_id");
        expect(response.status).to.eq(200);
      });
    });

    cy.visit("/");

    browser_login(Cypress.env("user"), Cypress.env("password"));

    cy.contains("Recent blobs").click();

    cy.get("@blob_id").then((blob_id) => {
      cy.contains(blob_id).click();
      cy.contains("Blob " + blob_id);
    });

    cy.contains("Details").click();

    cy.contains("Blob name");
    cy.contains("some.blob");
    cy.contains("Blob size");
    cy.contains("Blob type");
    cy.contains("inject");
    cy.contains("First seen");
    cy.contains("Last seen");

    cy.visit("/blob/fake");
    cy.contains(
      "The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again."
    );
    cy.contains("Details").click();

    cy.contains("Blob name");
    cy.contains("Blob size");
    cy.contains("Blob type");
    cy.contains("First seen");
    cy.contains("Last seen");

    cy.contains("Logout").click();
  });
});
