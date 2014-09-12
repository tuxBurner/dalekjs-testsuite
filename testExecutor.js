/**
 * This is wrapped arround each test for having stopwatching etc.
 * @param dalekTestJs dalek test framework
 * @param suiteTest the test from the suite to execute
 */
module.exports = function(dalekTestJs,suiteTest){
  var startTime = new Date().getTime();


  var testLog = {
    "name" : suiteTest.name,
    "params" : suiteTest.params
  };

  dalekTestJs.log.message('TEST_EXEC_'+JSON.stringify(testLog));

  suiteTest.test(dalekTestJs,suiteTest.params)

  var stopTime = new Date().getTime();

  dalekTestJs.log.message('TIME_'+(stopTime-startTime));
}
