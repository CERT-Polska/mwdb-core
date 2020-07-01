describe('Login test - Malwarecage', function() {
   it('Visit malwarecage', function () {
       cy.visit('http://mwdb:8080')

       cy.url()
           .should('include', '/login')

       cy.get(':nth-child(1) > .form-control')
           .type('admin')
           .should('have.value', 'admin')

       cy.get(':nth-child(2) > .form-control')
           .type('password')
           .should('have.value', '300e5df60f0ffa446223f4d1e576ed5806b5')

       cy.contains('Submit').click()
       cy.contains('Logged as: admin')

       cy.contains('Logout').click()
   })
})
