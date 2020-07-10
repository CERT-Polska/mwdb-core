import { browser_login, request_login } from "./util";

describe("Sample view test - Malwarecage", function () {
  it("Sample view test - existent and non-existent md5 and sha256 hashes", function () {
    request_login(Cypress.env("user"), Cypress.env("password"));

    //Declarations
    const fileName = "TEST";
    const method = "POST";
    const url = "http://127.0.0.1:80/api/file/root";
    const fileType = "text/plain";
    const inputContent2 = "input_content2";
    const expectedAnswer =
      '{"msg":"X elements from the excel where successfully imported"}';

    // Get file from fixtures as binary

    cy.get("@token").then((token) => {
      cy.fixture(fileName, "binary").then((bin) => {
        // File in binary format gets converted to blob so it can be sent as Form data
        Cypress.Blob.binaryStringToBlob(bin, fileType).then((blob) => {
          // Build up the form
          const formData = new FormData();
          formData.set("file", blob, fileName); //adding a file to the form
          formData.set("input2", inputContent2); //adding a plain input to the form

          // Perform the request
          cy.form_request(method, url, formData, token, function (response) {
            cy.wrap(String(JSON.parse(response.response).md5)).as("md");
            expect(response.status).to.eq(200);
          });
        });
      });
    });

    cy.visit("/");

    browser_login(Cypress.env("user"), Cypress.env("password"));

    cy.contains("Recent samples").click();

    cy.get("@md").then((md) => {
      cy.contains(md).click();
      cy.contains(md);
    });

    // cy.get("@token").then((token) => {
    //   cy.request({
    //     method: "POST",
    //     url: "/api/file/root",
    //     body: {
    //       files: { file: ("file1", "hello") },
    //     },
    //     headers: {
    //       Authorization: " Bearer " + token,
    //       "content-type": "multipart/form-data",
    //     },
    //   }).then((response) => {
    //     expect(response.status).to.eq(200);
    //   });
    // });
  });
});
