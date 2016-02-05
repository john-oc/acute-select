angular.module("acute.core.directives", [])
// Directive to set focus to an element when a specified expression is true
.directive('acuteFocus', ["$timeout", "$parse", function ($timeout, $parse) {
    return {
        restrict: "A",
        link: function (scope, element, attributes) {
            var setFocus = $parse(attributes.acuteFocus);
            scope.$watch(setFocus, function (value) {
                if (value === true) {
                    $timeout(function () {
                        element[0].focus();
                    });
                }
            });
            // Set the "setFocus" attribute value to 'false' on blur event
            // using the "assign" method on the function that $parse returns
            element.bind('blur', function () {
                scope.$apply(setFocus.assign(scope, false));
            });
        }
    };
}])

// Directive for a scroll container. Set acute-scroll-top to an expression and the div will scroll when it changes
.directive('acScrollTo', function () {
    return {
        restrict: "A",
        scope: false,
        controller: function ($scope, $element, $attrs) {
            var expression = $attrs.acScrollTo;
            $scope.$watch(expression, function () {
                var scrollTop = $scope.$eval(expression);
                angular.element($element)[0].scrollTop = scrollTop;
            });
        }
    };
})

// Call a function when the element is scrolled
// E.g. ac-on-scroll="listScrolled()" 
// N.B. take care not to use the result to directly update an acScrollTo expression
// as this will result in an infinite recursion!
.directive('acOnScroll', function () {
    return {
        restrict: "A",
        link: function (scope, element, attrs) {
            var callbackName = attrs.acOnScroll;
            if (callbackName.indexOf("()") === callbackName.length - 2) {
                callbackName = callbackName.substr(0, callbackName.length - 2);
            }
            var callback = scope[callbackName];
            if (typeof callback === "function") {
                element.bind("scroll", function () {
                    callback(element[0].scrollTop);
                });
            }
        }
    };
});