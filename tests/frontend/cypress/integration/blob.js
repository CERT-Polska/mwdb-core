describe('Blob test - Malwarecage', function() {
   it('Blob test', function () {
       cy.visit('http://malwarefront:80')

       cy.url()
           .should('include', '/login')

       cy.get(':nth-child(1) > .form-control')
           .type('admin')
           .should('have.value', 'admin')

       cy.get(':nth-child(2) > .form-control')
           .type(Cypress.env('admin_password'))
           .should('have.value', Cypress.env('admin_password'))

       cy.contains('Submit').click()
       cy.contains('Logged as: admin')

       cy.contains('Recent blobs').click()
       cy.contains('some.blob')

       cy.contains('Logout').click()
   })
})