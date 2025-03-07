import { requestLogin, browserLogin } from "./util";

describe("Blob view test - mwdb-core", function () {
  it("Blob view test - existent and non-existent hash", function () {
    requestLogin(Cypress.env("user"), Cypress.env("password"));

    const requestMethod = "POST";
    const apiUrl = "/api/blob";
    const blobName = "some.blob";
    const blobType = "inject";
    const blobContent = "TEST";

    cy.get("@token").then((token) => {
      cy.request({
        method: requestMethod,
        url: apiUrl,
        body: {
          blob_name: blobName,
          blob_type: blobType,
          content: blobContent,
        },
        headers: {
          Authorization: "Bearer " + token,
        },
      }).then((response) => {
        cy.wrap(response.body.id).as("blobId");
        expect(response.status).to.eq(200);
      });
    });

    cy.visit("/");

    browserLogin(Cypress.env("user"), Cypress.env("password"));

    cy.contains("Blobs").click({ timeout: 10000 });

    cy.get("@blobId").then((blobId) => {
      cy.get('.d-none a[href*="' + blobId + '"] > div').click({ force: true });
      cy.intercept("GET", "/api/blob/" + blobId)
        .as("dataGetFirst");
    });

    cy.get("div[class='ace_line']").should(($div) => {
      const text = $div.text();
      expect(text).to.include(blobContent);
    });

    cy.contains("Details").click({ force: true });
    cy.contains("Blob name");
    cy.contains("some.blob");
    cy.contains("Blob size");
    cy.contains("Blob type");
    cy.contains("inject");
    cy.contains("First seen");
    cy.contains("Last seen");

    cy.get("a.nav-link").contains("Relations").click({ force: true });
    cy.get("g[class='node expanded-node']");

    cy.visit("/blob/fake");
    cy.contains(
      "The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again."
    );

    cy.contains("Logout").click({ force: true });
  });
});
