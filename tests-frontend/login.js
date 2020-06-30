describe('My First Test', function() {
   it('Visit malwarecage', function () {
       cy.visit('127.0.0.1')

       cy.url()
           .should('include', '/login')

       cy.get(':nth-child(1) > .form-control')
           .type('admin')
           .should('have.value', 'admin')

       cy.get(':nth-child(2) > .form-control')
           .type('password')
           .should('have.value', 'password')

       cy.contains('Submit').click()
       cy.contains('Logged as: admin')

       cy.contains('Logout').click()
   })
})
