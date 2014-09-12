/**
 * Enters a search term into the google search input
 * @param test
 * @param params
 */
module.exports = function(test,params){
    test
        .waitForElement('input[name="q"]')
        .type('input[name="q"]', params.term)
};
