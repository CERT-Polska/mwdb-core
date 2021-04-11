export const requestLogin = (username, password) => {
  cy.request("POST", "/api/auth/login", {
    login: username,
    password: password,
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property("token");
    cy.wrap(response.body.token).as("token");
  });
};

export const browserLogin = (username, password) => {
  cy.url().should("include", "/login");

  cy.get("input[name=login]").type(username).should("have.value", username);

  cy.get("input[name=password]").type(password).should("have.value", password);

  cy.contains("Submit").click();
  cy.get("a.profile-button").should("have.attr", "href").and('contain', '/profile');
};
