/// <reference path="../lib/jasmine-1.3.0/jasmine.js" />

// Create a dummy timeout service, because the 
// real $timeout doesn't work with jasmine (it seems)
angular.module('dummyTimeout', [])
.factory('$timeout', function () {
    return function (fnToExecute) {
        // Simply execute the function passed in
        fnToExecute();
    };
});

describe("Test acuteFocus directive", function () {

    var scope,
        elem,
        directive,
        compiled,
        html;

    beforeEach(function () {

        // Modules to test
        module('acute.core.directives', 'dummyTimeout');

        html = '<div><input id="txt1" tabindex="0" /><input id="txt2" acute-focus="giveTextBoxTheFocus" /></div>';

        inject(function ($compile, $rootScope) {
            //create a scope (you could just use $rootScope, I suppose)
            scope = $rootScope.$new();

            //get the jqLite or jQuery element
            elem = angular.element(html);

            // Add element to the document so it can receive the focus
            elem.appendTo($(document.body));

            // Compile the element into a function to process the view.
            compiled = $compile(elem);

            // Run the compiled view.
            compiled(scope);

            //call digest on the scope!
            scope.$digest();
        });
    });

    it("Sets focus to a textbox", function () {
        $("#txt1").focus();
        expect($(document.activeElement).attr("id")).toEqual("txt1");
        scope.giveTextBoxTheFocus = true;
        scope.$watch("giveTextBoxTheFocus", function () {
        });

        scope.$digest();
        expect($(document.activeElement).attr("id")).toEqual("txt2");
    });
});