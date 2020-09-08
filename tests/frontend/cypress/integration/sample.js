import { requestLogin, browserLogin } from "./util";

describe("Sample view test - mwdb-core", function () {
  it("Sample view test - existent and non-existent md5 and sha256 hashes", function () {
    requestLogin(Cypress.env("user"), Cypress.env("password"));

    const fileName = "TEST";
    const method = "POST";
    const apiUrl = "/api/file";
    const fileType = "text/plain";

    const addedFile = new Cypress.Promise((resolve) => {
      cy.get("@token").then((token) => {
        cy.fixture(fileName).then((bin) => {
          return Cypress.Blob.binaryStringToBlob(bin, fileType).then((blob) => {
            const formData = new FormData();
            formData.set("file", blob, fileName);

            cy.formRequest(method, apiUrl, formData, token).then(
              (response) => {
                expect(response.status).to.eq(200);
                resolve(response.response.body);
              }
            );
          });
        });
      });
    });

    addedFile.then((fileData) => {
      cy.visit("/");
      browserLogin(Cypress.env("user"), Cypress.env("password"));

      cy.contains("Samples").click();
      cy.get('.d-none a[href*="'+fileData.md5+'"] > div').click();
      cy.contains(fileData.md5);
      cy.contains("Filename");
      cy.contains("TEST");
      cy.contains("12");
      cy.contains("File type");
      cy.contains("ASCII text");
      cy.contains("sha1");
      cy.contains("sha256");
      cy.contains("sha512");
      cy.contains("crc32");
      cy.contains("ssdeep");
      cy.contains("Upload time");

      cy.get("a").contains("Relations").click()
      cy.get("g[class='node expanded-node']");

      cy.get("a").contains("Preview").click()
      cy.get("div[class='ace_line']");

      cy.contains("Samples").click();

      cy.get('.d-none a[href*="'+fileData.sha256+'"] > div').should("be.visible").click();

      cy.contains(fileData.sha256);

      cy.visit("/sample/fake");
      cy.contains(
        "The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again."
      );
      cy.visit("/sample/03040506708090aabbccddeeff112233");
      cy.contains("Object not found");

      cy.contains("Logout").click();
    });
  });
});
