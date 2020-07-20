import { requestLogin, browserLogin } from "./util";

describe("Config view test - Malwarecage", function () {
  it("Config view test - existent and non-existent hash", function () {
    requestLogin(Cypress.env("user"), Cypress.env("password"));

    const requestMethod = "PUT";
    const apiUrl = "/api/config/root";
    const testText = "test";
    const malwareFamily = "malwarex";

    cy.get("@token").then((token) => {
      cy.request({
        method: requestMethod,
        url: apiUrl,
        body: {
          cfg: {
            plain: testText,
            list: [{ dict_in_list: testText }],
            dict: {
              field: testText,
            },
          },
          family: malwareFamily,
        },
        headers: {
          Authorization: " Bearer " + token,
        },
      }).then((response) => {
        cy.wrap(response.body.id).as("configId");
        expect(response.status).to.eq(200);
      });
    });

    cy.visit("/");

    browserLogin(Cypress.env("user"), Cypress.env("password"));

    cy.contains("Recent configs").click();

    cy.get("@configId").then((configId) => {
      cy.contains(configId).click();
      cy.contains("Config " + configId);
    });

    cy.contains("Family");
    cy.contains("malwarex");
    cy.contains("Config type");
    cy.contains("static");
    cy.contains("dict");
    cy.contains('{ "field": "test" }');
    cy.contains("list");
    cy.contains('[ { "dict_in_list": "test" } ]');
    cy.contains("plain");
    cy.contains("test");
    cy.contains("Upload time");

    cy.visit("/config/fake");
    cy.contains(
      "The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again."
    );

    cy.contains("Logout").click();
  });
});
