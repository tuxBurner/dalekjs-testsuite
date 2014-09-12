/**
 * Checks if the title is Google
 * @param test
 * @param params
 */
module.exports = function (test, params) {
    test
        .assert.title().is('Google', 'It has title')

};