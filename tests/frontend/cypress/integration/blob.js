describe("Blob view test - Malwarecage", function () {
  it("Blob view test - existent and non-existent hash", function () {
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
        url: "http://malwarefront:80/api/blob/root",
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

    cy.visit("http://malwarefront:80");

    cy.url().should("include", "/login");

    cy.get("input[name=login]").type("admin").should("have.value", "admin");

    cy.get("input[name=password]")
      .type(Cypress.env("admin_password"))
      .should("have.value", Cypress.env("admin_password"));

    cy.contains("Submit").click();
    cy.contains("Logged as: admin");

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

    cy.visit("http://malwarefront:80/blob/fake");
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
