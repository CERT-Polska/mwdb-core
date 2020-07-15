import { request_login, browser_login } from "./util";

describe("Config view test - Malwarecage", function () {
  it("Config view test - existent and non-existent hash", function () {
    request_login(Cypress.env("user"), Cypress.env("password"));

    const request_method = "PUT";
    const api_url = "/api/config/root";
    const test_text = "test";
    const malware_family = "malwarex";

    cy.get("@token").then((token) => {
      cy.request({
        method: request_method,
        url: api_url,
        body: {
          cfg: {
            plain: test_text,
            list: [{ dict_in_list: test_text }],
            dict: {
              field: test_text,
            },
          },
          family: malware_family,
        },
        headers: {
          Authorization: " Bearer " + token,
        },
      }).then((response) => {
        cy.wrap(response.body.id).as("config_id");
        expect(response.status).to.eq(200);
      });
    });

    cy.visit("/");

    browser_login(Cypress.env("user"), Cypress.env("password"));

    cy.contains("Recent configs").click();

    cy.get("@config_id").then((config_id) => {
      cy.contains(config_id).click();
      cy.contains("Config " + config_id);
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
