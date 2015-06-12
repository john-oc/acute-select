// Common services
angular.module("acute.core.services", [])

// safeApply service, courtesy Alex Vanston and Andrew Reutter
.factory('safeApply', ['$rootScope', function ($rootScope) {
    return function ($scope, fn) {
        var phase = $scope.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn) {
                $scope.$eval(fn);
            }
        } else {
            if (fn) {
                $scope.$apply(fn);
            } else {
                $scope.$apply();
            }
        }
    }
}])

.factory('keyCode', function () {
    return {
        'backspace': 8,
        'tab': 9,
        'enter': 13,
        'shift': 16,
        'ctrl': 17,
        'alt': 18,
        'pause': 19,
        'capsLock': 20,
        'esc': 27,
        'escape': 27,
        'pageUp': 33,
        'pageDown': 34,
        'end': 35,
        'home': 36,
        'leftArrow': 37,
        'upArrow': 38,
        'rightArrow': 39,
        'downArrow': 40,
        'insert': 45,
        'del': 46,  // Note cannot use "delete" as it breaks IE8 because it's a reserved word
        '0': 48,
        '1': 49,
        '2': 50,
        '3': 51,
        '4': 52,
        '5': 53,
        '6': 54,
        '7': 55,
        '8': 56,
        '9': 57,
        'a': 65,
        'b': 66,
        'c': 67,
        'd': 68,
        'e': 69,
        'f': 70,
        'g': 71,
        'h': 72,
        'i': 73,
        'j': 74,
        'k': 75,
        'l': 76,
        'm': 77,
        'n': 78,
        'o': 79,
        'p': 80,
        'q': 81,
        'r': 82,
        's': 83,
        't': 84,
        'u': 85,
        'v': 86,
        'w': 87,
        'x': 88,
        'y': 89,
        'z': 90,
        '0numpad': 96,
        '1numpad': 97,
        '2numpad': 98,
        '3numpad': 99,
        '4numpad': 100,
        '5numpad': 101,
        '6numpad': 102,
        '7numpad': 103,
        '8numpad': 104,
        '9numpad': 105,
        'multiply': 106,
        'plus': 107,
        'minus': 109,
        'dot': 110,
        'slash1': 111,
        'F1': 112,
        'F2': 113,
        'F3': 114,
        'F4': 115,
        'F5': 116,
        'F6': 117,
        'F7': 118,
        'F8': 119,
        'F9': 120,
        'F10': 121,
        'F11': 122,
        'F12': 123,
        'equals': 187,
        'comma': 188,
        'slash': 191,
        'backslash': 220
    };
});