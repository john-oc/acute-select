/// <reference path="../lib/jasmine-1.3.0/jasmine.js" />
/// <reference path="../../lib/angular.1.2.1.js" />
/// <reference path="../../lib/angular-mocks.1.2.1.js" />

describe("Testing Acute Select Directive", function () {
    var $scope,
        $compile;

    beforeEach(function () {
        //load the module
        module('acute.select');

        inject(function (_$compile_, $rootScope, $templateCache) {

            // Create a scope
            $scope = $rootScope.$new();

            $compile = _$compile_;

            var directiveTemplate = null;
            var req = new XMLHttpRequest();
            req.onload = function () {
                directiveTemplate = this.responseText;
            };

            // Using 'false' as the third parameter to open() makes the operation synchronous.
            req.open("get", "../acute.select/templates/acute.select.htm", false);
            req.send();
            $templateCache.put("/acute.select/templates/acute.select.htm", directiveTemplate);
        });
    });

    it("Creates a UL dropdown and selects 'Red' when 'r' is entered in the search box", function () {

        // Data for the select
        $scope.colours = [
          { name: 'black', shade: 'dark' },
          { name: 'white', shade: 'light' },
          { name: 'red', shade: 'dark' },
          { name: 'blue', shade: 'dark' },
          { name: 'yellow', shade: 'light' }
        ];

        $scope.selectedColour = $scope.colours[2]; // red

        // Set our view html.
        var html = '<select class="acute-select" acute-model="selectedColour" acute-options="selectedColour.name for colour in colours"></select>';

        // Get the jqLite or jQuery element
        var element = angular.element(html);

        // Compile the element into a function to process the view.
        var compiled = $compile(element);

        // Run the compiled view.
        compiled($scope);

        // Call digest on the scope!
        $scope.$digest();

        var ul = element.find("UL");
        expect(ul.length).toEqual(1);
        var items = element.find("LI");
        expect(items.length).toEqual(5);

        var table = element.find("TABLE");
        table.click();
        $scope.$digest();

        var dropdownDiv = element.find(".acute-select-popup");
        expect(dropdownDiv.length).toEqual(1);
        //expect(dropdownDiv.is(":visible")).toBe(true);
        var searchBox = dropdownDiv.find("INPUT");
        expect(searchBox.length).toEqual(1);
        searchBox.text("r");
        $scope.$digest();
        expect(typeof $scope.selectedColour).toBe("object");
        expect($scope.selectedColour.name).toBe("red");
    });
});

