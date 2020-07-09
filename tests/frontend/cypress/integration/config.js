describe("Config view test - Malwarecage", function () {
  it("Config view test - existent and non-existent hash", function () {
    cy.request("POST", "http://malwarefront:80/api/auth/login", {
      login: "admin",
      password: Cypress.env("admin_password"),
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property("token");
      cy.wrap(response.body.token).as("token");
    });

    cy.get("@token").then((token) => {
      cy.request({
        method: "PUT",
        url: "http://malwarefront:80/api/config/root",
        body: {
          cfg: {
            plain: "cos",
            list: [{ dict_in_list: "cos" }],
            dict: {
              field: "cos",
            },
          },
          family: "malwarex",
        },
        headers: {
          Authorization: " Bearer " + token,
        },
      }).then((response) => {
        cy.wrap(response.body.id).as("config_id");
        expect(response.status).to.eq(200);
      });
    });

    cy.visit("http://malwarefront:80");

    cy.url().should("include", "/login");

    cy.get("input[name=login]").type("admin").should("have.value", "admin");

    cy.get("input[name=password]")
      .type(Cypress.env("admin_password"))
      .should("have.value", Cypress.env("admin_password"));

    cy.contains("Submit").click();
    cy.contains("Logged as: admin");

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
    cy.contains('{ "field": "cos" }');
    cy.contains("list");
    cy.contains('[ { "dict_in_list": "cos" } ]');
    cy.contains("plain");
    cy.contains("cos");
    cy.contains("Upload time");

    cy.visit("http://malwarefront:80/config/fake");
    cy.contains(
      "The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again."
    );
    cy.contains("Details").click();

    cy.contains("Config type");
    cy.contains("Upload time");
    cy.contains("Group name");
    cy.contains("Reason");
    cy.contains("Access time");

    cy.contains("Logout").click();
  });
});
