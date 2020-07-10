// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
Cypress.Commands.add("form_request", (method, url, formData, token, done) => {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url);
  xhr.onload = function () {
    done(xhr);
  };
  xhr.onerror = function () {
    done(xhr);
  };
  xhr.setRequestHeader("Authorization", " Bearer " + token);
  xhr.send(formData);
});
