/**
 * Clicks on the element with the given id
 */
module.exports = function(test,params){
    test
        .assert.exists(params.selector,"Button: "+params.selector+" exists")
        .click(params.selector)
        .wait(300)
};
