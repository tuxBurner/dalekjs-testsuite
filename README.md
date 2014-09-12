# DalekJs TestSuite Wrapper #
## For what is this good ? ##

Quote from: http://dalekjs.com/
> Automated cross browser testing with Javascript!

With DalekJs it is realy simple to write automated tests via Javascript.

But it lagged some features, so i wrote a wrapper around it to make it better for my use cases.

1. Often you execute the same test like "login" with diffrent users, i wanted that the tests can be configured via a json file.
2. Often the same click paths are the same, so i needed something like a test chain.
3. You need own functions in the tests, like build a css selector or log something to the console.
4. I needed tearUps and tearDowns
5. I needed a report generator which is customizable for diffrent customers.
6. Assert if a screenshot differs from another.
7. Measure how long a test takes.
8. A Person can configure tests without knowledge of the test code.

## So how does this work ##

### Tests json configuration file ####

To parameterize tests and give them a name you can configure them like this.

```json
{
  "login" : {
      "asAdmin" : {
          "user" : "admin",
          "pass" : "topSecret"
      },
      "asUser" : {
          "user" : "user",
          "pass" : "topSecret"
      }
  },
  "click" : {
      "loginButton" : {
          "selector" : "#lgnBtn"
      }
  },
  "chains" : {
    "loginAsAdminAndClick" : ["login.asAdmin","click.loginButton"]
  }
}
```

* in this example there is a login.js in the tests folder which can be called with the parameter set asAdmin or asUser
* also there is a click.js which takes a css selector and clicks on th is element
* **chains** are special they represent a list of tests which are executed after each other. In the suite configuration you configure them with **execute_chainName**

### Suite json configuration file ####

Each testsuite is configured by a json file:

```json
{
    "name": "Google Tests",
    "testFile": "./tests.json",
    "functionFile": "./functions.js",
    "testStepWaitTime": 50,
    "baseUrl": "http://google.com/",
    "tearUps": ["makeSureItsGoogle"],
    "tearDowns": ["makeSureItsGoogle"],
    "tests": {
        "Login as tuxBurner": [{"name" : "login", "params" : {"user" : "tuxBurner", "pass" : "topSecret"}}],
        "Login as admin": ["login.asAdmin","click.loginButton"],
        "Login as User":  ["login.asUser","click.loginButton"],
        "Call the login as admin chain" : ["execute_loginAsAdminAndClick"]
    }
}
```

The Parameters are the following:
* name: The name of the test suite
* testFile: the json configuration file for tests
* functionFile: the js file holding the self written functions.
* testStepWaitTime: how man milliseconds to wait between evry test
* baseUrl: the baseUrl to open for each test
* tearUps: an array of tests which are executed before each test in tests.
* tearDown: an array of tests which are executed after each test in tests.
* tests: the actual configuration of tests.

### Test files ###
The test files are located in the **tests** folder.

*login.js*
```js
/**
 * Fills out the login form
 */
module.exports = function(test,params){
    test
        .type('input.username', params.user)
        .type('input.password', params.pass)
        .click(params.selector)
        .wait(300)
};
```


*click.js*
```js
/**
 * Clicks on the element with the given id
 */
module.exports = function(test,params){
    test
        .assert.exists(params.selector,"Elemnt: "+params.selector+" exists")
        .click(params.selector)
        .wait(300)
};

```

### Own functions ###
Sometimes you will need a function in more than in one test file. For example log the parameters to the console.
The file which holds the functions is configured in your suite config file.
All functions are stored in the **test.sFuncs** var.

```js
/**
* Self written functions
*/
module.exports = {

    /**
    * echo something to the console :)
    */
    echo : function(message) {
        console.log(message);
    }
}
```

To us the function **echo** from the  example above you can call it in any test javascript file like this:

```js
/**
 * Example
 * @param test
 * @param params
 */
module.exports = function(test,params){
    test.sFuncs.echo(params);
};
```

## Installation ##
1. Install the dalek-cli: ```npm install dalek-cli -g```
2. Clone this repo and cd into the directory.
3. Call ```npm install --save-dev```
3. Execute: ```dalek dalekTestSuite.js -b chrome  -f ./sampleTest/``` this executes the testsuite in the **sampleTest** folder.
4. Take a look into the **sampleTest** folder, to see what kind of magic is possible with this tool.

## Parameters for a test suite ##
You cann call **dalek dalekTestSuite.js** with the following parameters:

* **--baseFolder / -f **: Which is the basefolder holding the test data default is: ./
* **--suiteToRun / -s**: Which suite is supposed to be executed default is: ./suite.json
* **--testToRun / -t **: Which test to run if not set all are executed
* **--baseUrl / -o**: Which base url to start with, overrids the configured one in the suite


## TODOs ##
* Call DalekJs directly with out the cli.
* Screenshot comparison.
* Report generator is still in progress.
