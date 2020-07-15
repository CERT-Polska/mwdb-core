import { request_login, browser_login } from "./util";

describe("Blob view test - Malwarecage", function () {
  it("Blob view test - existent and non-existent hash", function () {
    request_login(Cypress.env("user"), Cypress.env("password"));

    const request_method = "PUT";
    const api_url = "/api/blob/root";
    const blob_name = "some.blob";
    const blob_type = "inject";
    const blob_content = "TEST";

    cy.get("@token").then((token) => {
      cy.request({
        method: request_method,
        url: api_url,
        body: {
          blob_name: blob_name,
          blob_type: blob_type,
          content: blob_content,
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

    cy.contains("Logout").click();
  });
});
