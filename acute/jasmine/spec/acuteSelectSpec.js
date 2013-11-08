/// <reference path="../lib/jasmine-1.3.0/jasmine.js" />
/// <reference path="../../lib/angular.1.2.0.rc3.js" />
/// <reference path="../../lib/angular-mocks.1.2.rc3.js" />

describe("Testing Acute Select Directive", function () {
    var scope,
        elem,
        directive,
        compiled,
        html;

    beforeEach(function () {
        //load the module
        module('acute.select');

        //set our view html.
        html = '<select class="acute-select" acute-model="selectedColour" acute-options="selectedColour.name for colour in colours"></select>';

        inject(function ($compile, $rootScope, $templateCache) {

            // Create a scope
            scope = $rootScope.$new();

            // First compile the ng-include div
            //var include = '<div class="ng-include acute-select-template" src="\'../acute.select/templates/acute.select.htm\'"></div>';
            //var linkFn = $compile(include);
            //linkFn(scope);
            //scope.$digest();
            
            //$templateCache.put("/acute.select/templates/acute.select.htm", scope.element[0].html());

            var directiveTemplate = null;
            var req = new XMLHttpRequest();
            req.onload = function () {
                directiveTemplate = this.responseText;
            };
            // Note that the relative path may be different from your unit test HTML file.
            // Using `false` as the third parameter to open() makes the operation synchronous.
            // Gentle reminder that boolean parameters are not the best API choice.
            req.open("get", "../acute.select/templates/acute.select.htm", false);
            req.send();
            $templateCache.put("/acute.select/templates/acute.select.htm", directiveTemplate);

            // Data for the select
            scope.colours = [
              { name: 'black', shade: 'dark' },
              { name: 'white', shade: 'light' },
              { name: 'red', shade: 'dark' },
              { name: 'blue', shade: 'dark' },
              { name: 'yellow', shade: 'light' }
            ];

            scope.selectedColour = scope.colours[2]; // red

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

    it("Creates a UL element with an LI for each colour", function () {
        var ul = elem.find("UL");
        expect(ul.length).toEqual(1);
        var items = elem.find("LI");
        expect(items.length).toEqual(5);
    });
});

