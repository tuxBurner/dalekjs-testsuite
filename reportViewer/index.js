'use strict';

// ext. libs
var Handlebars = require('handlebars');
var fs = require('fs-extra');
var stdio = require('stdio');

// int. globals
var reporter = null;

/**
* @class Reporter
* @constructor
* @part html
* @api
*/
function Reporter() {
  // where to put the report
  this.dest = 'report';
  this.suiteRportJson = '../report/dalek.json';

  this.testData = require(this.suiteRportJson);
  this.loadTemplates();
  this.initOutputHandlers();
  this.writeHtml();
}

/**
* @module Reporter
*/

/*module.exports = function (opts) {
reporter = new Reporter(opts);
return reporter;
};*/

Reporter.prototype = {

  /**
  * Inits the html buffer objects
  *
  * @method initOutputHandlers
  * @chainable
  */

  initOutputHandlers: function () {
    this.output = {};
    this.output.test = {};
    return this;
  },

  /**
  * Loads and prepares all the templates for
  * CSS, JS & HTML
  *
  * @method loadTemplates
  * @chainable
  */

  loadTemplates: function () {
    // collect client js (to be inined later)
    /*this.js = fs.readFileSync(__dirname + '/themes/default/js/default.js', 'utf8');*/

    // register handlebars helpers
    Handlebars.registerHelper('roundNumber', function (number) {
      return Math.round(number * Math.pow(10, 2)) / Math.pow(10, 2);
    });

    Handlebars.registerHelper('listTestMenu', function(tests, options) {
      var out = "";
      for(var idx in tests) {
        out+="<li><a>"+idx+"</a><ul>";
        for(var browserIdx in tests[idx]) {
          out+="<li><a>"+browserIdx+"</a></li>";
        }
        out+="</ul></li>";
      }
      return out;
    });

    // collect & compile templates
    this.templates = {};
    this.templates.wrapper = Handlebars.compile(fs.readFileSync(__dirname + '/templates/wrapper.hbs', 'utf8'));
    this.templates.generalInfo = Handlebars.compile(fs.readFileSync(__dirname + '/templates/generalInfo.hbs', 'utf8'));
    this.templates.testResult = Handlebars.compile(fs.readFileSync(__dirname + '/templates/testResult.hbs', 'utf8'));


    return this;
  },

  /**
  * Writes the html content
  */
  writeHtml:  function () {

    // add test results
    /*var keys = Object.keys(this.output.test);
    keys.forEach(function (key) {
    tests += this.output.test[key];
  }.bind(this));*/

  // compile the test result template
  /*body = this.templates.testresult({result: data, tests: tests});*/

  // compile the banner
  /*banner = this.templates.banner({status: data.status});*/

  // compile the contents within the wrapper template
  /*contents = this.templates.wrapper({styles: this.styles, js: this.js, banner: banner, body: body});*/

  var testsHtml = "";

  var testsSorted = {};
  for(var idx in this.testData.tests) {
    var test = this.testData.tests[idx];
    if(testsSorted[test.name] === undefined) {
      testsSorted[test.name] = {};
    }
    testsSorted[test.name][test.browser] = test;
  }

  for(var idx in testsSorted) {
    testsHtml+=this.templates.testResult({'testName': idx});
  }

  var generalInfo = this.templates.generalInfo({'result': this.testData});
  var contents = this.templates.wrapper({'generalInfo': generalInfo, 'tests': testsSorted,'testsHtml': testsHtml});

  // copy css and js to the report dest
  fs.copy(__dirname + '/templates/cssJs', this.dest+'/cssJs');

  // save the main test output file
  //this._recursiveMakeDirSync(this.dest + '/details');
  fs.writeFileSync(this.dest + '/index.html', contents, 'utf8');
  return this;
},


/**
* Prepares the output for a test detail page
*
* @method startDetailPage
* @chainable
*/

startDetailPage: function () {
  this.detailContents = {};
  this.detailContents.eventLog = [];
  return this;
},

/**
* Adds an action output to the detail page
*
* @method addActionToDetailPage
* @param {object} data Event data
* @chainable
*/

addActionToDetailPage: function (data) {
  data.isAction = true;
  this.detailContents.eventLog.push(data);
  return this;
},

/**
* Adds an assertion result to the detail page
*
* @method addAssertionToDetailPage
* @param {object} data Event data
* @chainable
*/

addAssertionToDetailPage: function (data) {
  data.isAssertion = true;
  this.detailContents.eventLog.push(data);
  return this;
},

/**
* Writes a detail page to the file system
*
* @method finishDetailPage
* @param {object} data Event data
* @chainable
*/

finishDetailPage: function (data) {
  this.detailContents.testResult = data;
  this.detailContents.styles = this.styles;
  this.detailContents.js = this.js;
  fs.writeFileSync(this.dest + '/details/' + data.id + '.html', this.templates.detail(this.detailContents), 'utf8');
  return this;
},

/**
* Stores the current browser name
*
* @method outputRunBrowser
* @param {string} browser Browser name
* @chainable
*/

outputRunBrowser: function (browser) {
  this.temp.browser = browser;
  return this;
},

/**
* Writes the index page to the filesystem
*
* @method outputRunnerFinished
* @param {object} data Event data
* @chainable
*/

outputRunnerFinished: function (data) {
  var body = '';
  var contents = '';
  var tests = '';
  var banner = '';

  // add test results
  var keys = Object.keys(this.output.test);
  keys.forEach(function (key) {
    tests += this.output.test[key];
  }.bind(this));

  // compile the test result template
  body = this.templates.testresult({result: data, tests: tests});

  // compile the banner
  banner = this.templates.banner({status: data.status});

  // compile the contents within the wrapper template
  contents = this.templates.wrapper({styles: this.styles, js: this.js, banner: banner, body: body});

  // save the main test output file
  this.events.emit('report:written', {type: 'html', dest: this.dest});
  this._recursiveMakeDirSync(this.dest + '/details');
  fs.writeFileSync(this.dest + '/index.html', contents, 'utf8');
  return this;
},

/**
* Pushes an assertion result to the index output queue
*
* @method outputAssertionResult
* @param {object} data Event data
* @chainable
*/

outputAssertionResult: function (data) {
  this.temporaryAssertions.push(data);
  return this;
},

/**
* Pushes an test result to the index output queue
*
* @method outputTestFinished
* @param {object} data Event data
* @chainable
*/

outputTestFinished: function (data) {
  data.assertionInfo = this.temporaryAssertions;
  data.browser = this.temp.browser;
  this.output.test[data.id] = this.templates.test(data);
  this.temporaryAssertions = [];
  return this;
},

/**
* Helper method to generate deeper nested directory structures
*
* @method _recursiveMakeDirSync
* @param {string} path PAth to create
*/

_recursiveMakeDirSync: function (path) {
  var pathSep = require('path').sep;
  var dirs = path.split(pathSep);
  var root = '';

  while (dirs.length > 0) {
    var dir = dirs.shift();
    if (dir === '') {
      root = pathSep;
    }
    if (!fs.existsSync(root + dir)) {
      fs.mkdirSync(root + dir);
    }
    root += dir + pathSep;
  }
}
};

// start creating the report
new Reporter();
