/**
 * This is a helper to manae to use the great dalek.js in a scripty way :)
 * @type {function(): target|exports}
 */


// required libaries
var extend = require('extend');
var clc = require('cli-color');
var stdio = require('stdio');


/**
 * Logs a default log message to the console
 * @param msg the msessge to log
 * @param objName additional informations
 */
var defaultLog = function (msg, objName) {
    console.log(clc.blue.bold(msg) + clc.white(objName));
}

/**
 * Logs an error log message to the console
 * @param msg the msessge to log
 * @param objName additional informations
 */
var errorLog = function (msg, objName) {
    console.log(clc.red.bold(msg) + clc.white.bold(objName));
}


/**
 * Read the parameters from the cli
 */
var ops = stdio.getopt({
    'suiteToRun': { description: 'Which suite is supposed to be executed default is: ./suite.json', args: 1, key: 's' },
    'testToRun': { description: 'Which test to run if not set all are executed', args: 1, key: 't' },
    'baseUrl': { description: 'Which base url to start with', args: 1, key: 'o' },
    'baseFolder': { description: 'Which is the basefolder holding the test data default is: ./', args: 1, key: 'f' },
    'b': { description: "Which browser to use is passed to dalek directly", key: 'b' },
    'r': { description: " Reporter(s) you would like to invoke  is passed to dalek directly", key: 'r' }
});

/**
 * Which is the baseFolder holding the suite.json tests.json functions and tests ?
 * @type {string}
 */
var baseFolder = (ops['baseFolder'] === undefined) ? './' : ops['baseFolder'];

/**
 * Determine which suite json configuration file to load
 * @type {string}
 */
var suiteToRun = (ops['suiteToRun'] === undefined) ? baseFolder+'suite.json' : baseFolder+ops['suiteToRun'];

/**
 * Bootstrap file loading:
 * 1. The suite to execute
 * 2. The test configuration file
 * 3. Additional self defined functions
 */
try {
    var testSuites = require(suiteToRun);

    // load the file which holds the tests configurations
    var tests = require(baseFolder+testSuites.testFile);

    var sFuncs = (testSuites.functionFile === undefined) ? {} : require(baseFolder+testSuites.functionFile);

} catch (e) {
    errorLog("Error while loading config file: ", e)
    process.exit(1);
}

/**
 * Which url to handle as the baseurl
 */
var baseUrl = (ops['baseUrl'] === undefined) ? testSuites.baseUrl : ops['baseUrl'];


/**
 * Run only a specific test ?
 */
var testToRun = ops['testToRun'];
// check if the given test exists in the test configuration
if (testToRun !== undefined && testSuites.tests[testToRun] === undefined) {
    errorLog("Could not find test given by parameter ", testToRun)
    process.exit(1);
}

/**
 * Caches the tests
 * @type {{}}
 */
var testCache = {};

/**
 * Wrapper around each test for stopwatch etc
 * @type {exports}
 */
var testExecutor = require('./testExecutor.js');

/**
 * Loads the given test by its name and executes it.
 * @param testToRun the name of the test to run.
 * @param dalekTestJs the dalek test framework.
 */
var loadTestFileAndExecute = function (testToRun, dalekTestJs) {

    var testName = testToRun;
    var addParams = null;

    // special handling when thje test is an configuration object
    if (typeof testToRun === 'object') {
        testName = testToRun.name;
        addParams = testToRun.params;
    }

    defaultLog("Starting test with: ", testName);

    // split the test
    var splittedTest = testName.split('.');
    var testFileName = splittedTest[0];
    var testConfigName = splittedTest[1];


    // check testCache we only have to load it ones
    if (testCache[testFileName] == null) {
        testCache[testFileName] = require(baseFolder+'/tests/' + testFileName + '.js');
    }

    // get the actual js test function from the cache
    var testFunc = testCache[testFileName];


    var params = { };
    // do we have a configuration for this test ??
    if (testConfigName != null) {
        // configuration does not exists ?
        if (tests[testFileName][testConfigName] === undefined) {
            throw new Error("The test configuration: " + testName + " does not exist.");
        }

        for (param in tests[testFileName][testConfigName]) {
            params[param] = tests[testFileName][testConfigName][param];
        }

        extend(params, tests[testFileName][testConfigName].params)
    }

    // extend the params when additional params are set
    if (addParams != null) {
        extend(params, addParams);
    }

    // execute the test
    testExecutor(dalekTestJs, { "name": testName, "test": testFunc, "params": params });
}

/**
 * Executes a chain of tests.
 * @param testChain  an array of tests to run.
 * @param dalekTestJs the dalek test framework.
 * @param screenshot boolean if to take a test or not.
 */
var executeTestsChain = function (testChain, dalekTestJs, screenshot) {
    for (chainIdx in  testChain) {
        var testToLoad = testChain[chainIdx];
        var testName = testToLoad;
        var repeat = 1;

        // check if we have a test configuration object
        if (typeof testToLoad === 'object') {
            testName = testToLoad.name;
            if (testToLoad.repeat !== undefined) {
                repeat = testToLoad.repeat;
            }
        }

        // when the testname starts with execute_ check if the chanin exists
        if (testName.indexOf('execute_') == 0) {
            testName = testName.replace(/execute_/g, '');
            defaultLog("Loading chain: ", testName);
            var chain = tests.chains[testName];
            if (chain === undefined) {
                throw new Error("Chain " + testName + " does not exist.");
            }
            defaultLog("Chain found: ", chain);
            for (var i = 1; i <= repeat; i++) {
                executeTestsChain(chain, dalekTestJs, screenshot);
            }

            continue;
        }

        for(var i = 0; i < repeat; i++) {
            defaultLog("Found test: ", testName);
            loadTestFileAndExecute(testToLoad, dalekTestJs);
            if (screenshot == true) {
                dalekTestJs.wait(testSuites.testStepWaitTime);
                dalekTestJs.screenshot('./screens/:browser/' + dalekTestJs.name + '/' + chainIdx + '_' + testName + '_end.png')
            }
        }

    }
}


var loadTestSuite = function (testSuites) {
    var testSuitesExports = {};
    for (var testIdx in testSuites.tests) {

        // check if the user wants to run a certain test
        if (testToRun !== undefined && testIdx != testToRun) {
            continue;
        }

        testSuitesExports[testIdx] = function (dalekTestJs) {
            try {
                dalekTestJs.sFuncs = sFuncs;
                console.log(clc.yellow.bold("Starting setup for test: ") + clc.blue(dalekTestJs.name));

                defaultLog("Open url: ", baseUrl);
                dalekTestJs.open(baseUrl);

                if (testSuites.tearUps != null) {
                    defaultLog("Tearups found: ", testSuites.tearUps);
                    executeTestsChain(testSuites.tearUps, dalekTestJs, false);
                }
                var testChain = testSuites.tests[dalekTestJs.name];
                executeTestsChain(testChain, dalekTestJs, true);
                if (testSuites.tearDowns != null) {
                    defaultLog("Teardowns found: ", testSuites.tearDowns);
                    executeTestsChain(testSuites.tearDowns, dalekTestJs, false);
                }

                dalekTestJs.end().done();

                console.log(clc.yellow.bold("Finished setup test: ") + clc.blue(dalekTestJs.name));
            } catch (e) {
                errorLog("Error while setting up test: " + dalekTestJs.name + " : ", e)
                process.exit(1);
            }
        }
    }

    return testSuitesExports;
}


module.exports = loadTestSuite(testSuites);
