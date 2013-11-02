/// <reference path="../lib/jasmine-1.3.0/jasmine.js" />
/// <reference path="../../lib/angular.1.2.0.rc3.js" />
/// <reference path="../../lib/angular-mocks.1.2.rc3.js" />

describe("Testing Acute Select Directive", function () {
    var scope,
        elem,
        directive,
        compiled,
        html;
});

beforeEach(function () {
    //load the module
    module('acute.select','acute.core.directives','acute.core.services');

    //set our view html.
    html = '<div sample-one="foo"></div>';

    inject(function ($compile, $rootScope) {
        //create a scope (you could just use $rootScope, I suppose)
        scope = $rootScope.$new();

        //get the jqLite or jQuery element
        elem = angular.element(html);

        //compile the element into a function to 
        // process the view.
        compiled = $compile(elem);

        //run the compiled view.
        compiled(scope);

        //call digest on the scope!
        scope.$digest();
    });
});
