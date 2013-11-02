/// <reference path="../angular.1.0.7.js" />
/// <reference path="acute.core.directives.js" />
/// <reference path="acute.core.services.js" />

 //Directive that creates a searchable dropdown list.
 //Requires: acute.core.directives.js, acute.core.services.js

 //Associated attributes:-
 //acute-model - use instead of ng-model
 //acute-options - use instead of ng-options.

 //Example:- <select class="acute-select" acute-model="colour" acute-options="c.name for c in colours"></select>

 //Note:- acute-options works like ng-options, but does not support option groups

angular.module("acute.select", ["acute.core.directives", "acute.core.services"])
.directive("acuteSelect", function ($parse) {
    return {
        restrict: "AC",
        scope: {
            "acuteModel": "=",
            "acuteSettings": "@"
        },
        replace: true,
        templateUrl: "/acute.select/templates/acute.select.htm",
        link: function (scope, element, attrs) {
            // Default settings
            scope.settings = {
                "noItemsText": "No items found.",
                "itemHeight": 24,
                "itemsInView": 15,
                "minWidth": "100px",
                "showSearchBox": true,
                "comboMode": false,
                "loadOnCreate": false,
                "loadOnOpen": false,      // If true, load function will be called when dropdown opens, i.e. before any search text is entered
                "allowCustomText": false,
                "minSearchLength": 1,
                "filterType": "start",    // or "contains"
                "allowClear": true
            };

            scope.searchText = "";
            scope.longestText = "";
            scope.comboText = "";
            scope.items = [];
            scope.allItems = [];        // Unfiltered
            scope.selectedItem = null;
            scope.allDataLoaded = false;
            scope.scrollTo = 0;         // To change scroll position
            scope.scrollPosition = 0;   // Reported scroll position
            scope.listHeight = 0;
            scope.matchFound = false;

            // Check that acute-options and acute-model values are set
            var acuteOptions = attrs.acuteOptions;
            if (acuteOptions === undefined || attrs.acuteModel === undefined) {
                throw "acute-options and acute-model attributes must be set";
            }

            if (typeof scope.acuteModel !== "object") {
                throw "acute-model attribute value must be an object";
            }

            if (attrs.acuteSettings != undefined) {
                scope.acuteSettings = scope.$eval(attrs.acuteSettings);
                if (typeof scope.acuteSettings === "object") {
                    // Merge settings with default values
                    angular.extend(scope.settings, scope.acuteSettings);
                }
            }

            // Parse acuteOptions

            // Value should be in the form "label for value in array" or "for value in array"
            var words = acuteOptions.split(' ');
            var len = words.length;
            scope.textField = "";
            scope.dataFunction = null;

            if (len > 3) {
                if (len > 4) {
                    var label = words[len - 5];     // E.g. colour.name
                    scope.textField = label.split(".")[1];
                }
                else {
                    scope.textField = words[len - 3];
                }
                var dataName = words[len - 1];

                // See if a data load function is specified, i.e. name ends in "()"
                if (dataName.indexOf("()") === dataName.length - 2) {
                    dataName = dataName.substr(0, dataName.length - 2)
                    // Get a reference to the data function
                    var dataFunction = scope.$parent.$eval(dataName);
                    if (typeof dataFunction === "function") {
                        scope.dataFunction = dataFunction;
                        if (scope.settings.loadOnCreate) {
                            // Load initial data (args are callback function, search text and item offset)
                            scope.dataFunction(scope.dataCallback, "", 0);
                        }
                    }
                    else {
                        throw "Invalid data function: " + dataName;
                    }
                }
                else {
                    // Get the data from the parent scope
                    var dataItems = scope.$parent.$eval(dataName);
                    // Create dropdown items
                    scope.loadItems(dataItems, scope.acuteModel);
                    // Save selected item
                    scope.confirmedItem = angular.copy(scope.selectedItem);
                    scope.allDataLoaded = true;
                }
            }
        },

        // **************************************************************
        //                          CONTROLLER
        // **************************************************************
        controller: function ($scope, $element, $attrs, $window, $rootScope, $timeout, $filter, safeApply, keyCode) {

            // Create dropdown items based on the source data items
            $scope.loadItems = function (dataItems, selectedDataItem) {
                if (angular.isArray(dataItems)) {
                    var itemCount = $scope.items.length;
                    angular.forEach(dataItems, function (dataItem, index) {
                        var itemIndex = itemCount + index;
                        var itemID = "item" + $scope.$id + "_" + itemIndex;
                        var item = { "text": dataItem[$scope.textField], "value": dataItem, "index": itemIndex };
                        $scope.items.push(item);
                        if (dataItem === selectedDataItem) {
                            $scope.selectedItem = item;
                        }
                        if (item.text.length > $scope.longestText.length) {
                            $scope.longestText = item.text;
                        }
                    });
                    angular.copy($scope.items, $scope.allItems);
                    $scope.setListHeight();
                }
            };

            // Set height of list according to number of visible items
            $scope.setListHeight = function () {
                var itemCount = $scope.items.length;
                if (itemCount > $scope.settings.itemsInView) {
                    itemCount = $scope.settings.itemsInView;
                }

                $scope.listHeight = $scope.settings.itemHeight * itemCount;
            };

            if ($scope.selectedItem) {
                $scope.comboText = $scope.selectedItem.text;
            }

            // Close all instances when user clicks elsewhere
            $window.onclick = function (event) {
                closeWhenClickingElsewhere(event, function () {
                    $rootScope.$broadcast("acute-select-close-all");
                });
            };

            // Keyboard events
            $scope.keyHandler = function (event) {

                if (!$scope.settings.showSearchBox) {
                    handleCharCodes(event);
                }

                var stopPropagation = true;
                switch (event.which || event.keyCode) {
                    case keyCode.downArrow:
                        downArrowKey();
                        break;
                    case keyCode.upArrow:
                        upArrowKey();
                        break;
                    case keyCode.enter:
                        enterKey();
                        break;
                    case keyCode.end:
                        endKey();
                        break;
                    case keyCode.home:
                        homeKey();
                        break;
                    case keyCode.escape:
                        escapeKey();
                        break;
                    case keyCode.del:
                        deleteKey(event);
                        break;
                    case keyCode.pageUp:
                        pageUpKey();
                        break;
                    case keyCode.pageDown:
                        pageDownKey();
                        break;
                    default:
                        stopPropagation = false;
                        break;
                }

                if (stopPropagation) event.stopPropagation();
            };

            function handleCharCodes(event) {
                var char, i, item;
                if (event.keyCode) {
                    char = String.fromCharCode(event.keyCode);
                    for (i = 0; i < $scope.items.length; i++) {
                        item = $scope.items[i];
                        if (item.text.length > 0 && item.text.substr(0, 1).toUpperCase() === char) {
                            $scope.selectedItem = item;
                        }
                    }
                }
            }

            // Callback function to receive async data
            $scope.dataCallback = function (data, matchingItemTotal) {
                $scope.dataItems = data;
                var selectedDataItem = $scope.selectedItem ? $scope.selectedItem.value : null;
                $scope.loadItems(data, selectedDataItem);

                // If data function takes only one argument, all data is now loaded
                $scope.allDataLoaded = $scope.dataFunction.length === 1;
                // Clear loadOnOpen flag to avoid re-loading when dropdown next opened
                $scope.settings.loadOnOpen = false;

                // If a matchingItemTotal value is returned, we are in paging mode
                if (matchingItemTotal) {
                    $scope.paging = true;
                    $scope.matchingItemTotal = matchingItemTotal;
                    // If user was scrolling down
                    if ($scope.requestedItemIndex) {
                        // Select first of the newly loaded items (if present)
                        if ($scope.requestedItemIndex < $scope.items.length) {
                            $scope.selectedItem = $scope.items[$scope.requestedItemIndex];
                            ensureItemVisible($scope.selectedItem);
                        }
                        $scope.requestedItemIndex = null;
                    }
                    // Show loading message if not all items yet loaded
                    $scope.showLoadingMessage = $scope.items.length < matchingItemTotal;
                }
                $scope.loading = false;
            };

            $scope.findData = function () {
                filterData($scope.searchText);
            };

            $scope.comboTextChange = function () {
                $scope.popupVisible = true;
                filterData($scope.comboText);
            };

            // Show/hide popup
            $scope.togglePopup = function () {
                $scope.popupVisible = !$scope.popupVisible;
                if ($scope.popupVisible) {
                    if ($scope.settings.comboMode) {
                        $timeout(function () { $scope.comboFocus = true; });
                    }
                    else {
                        $timeout(function () { $scope.searchBoxFocus = true; });
                    }
                    if (!$scope.allDataLoaded && $scope.dataFunction && $scope.settings.loadOnOpen) {
                        // Load initial data (args are callback function, search text and item offset)
                        $scope.dataFunction($scope.dataCallback, "", 0);
                    }
                }
            };

            // When clicking on the acute-select-main div
            $scope.mainClick = function () {
                // Close any other acute-select instances
                $scope.sentBroadcast = true;
                $rootScope.$broadcast("acute-select-close-all");
            };

            $scope.$on("acute-select-close-all", function () {
                if (!$scope.sentBroadcast) {
                    $scope.popupVisible = false;
                    safeApply($scope);
                }
                else {
                    $scope.sentBroadcast = false;
                }
            });

            $scope.itemClick = function (i) {
                $scope.selectedItem = $scope.items[i];
                selectionConfirmed();
            };

            $scope.getItemClass = function (i) {
                if ($scope.selectedItem && $scope.items[i].value === $scope.selectedItem.value) {
                    return "acute-select-highlight";
                }
                else {
                    return "";
                }
            };

            $scope.addButtonClick = function () {
                if (customAddRequest()) {
                    selectionConfirmed();
                }
            };

            $scope.listScrolled = function (scrollPosition) {
                $scope.scrollPosition = scrollPosition;
                if ($scope.paging) {
                    var totalHeight = $scope.items.length * $scope.settings.itemHeight;
                    // If scrolled past the last item
                    if (scrollPosition > totalHeight - $scope.listHeight) {
                        $scope.loadMore();
                    }
                }
            };

            // Load further data when paging is enabled
            $scope.loadMore = function () {
                if (!$scope.loading && $scope.showLoadingMessage) {
                    $scope.loading = true;
                    var offSet = $scope.items.length;
                    var searchText = $scope.settings.comboMode ? $scope.comboText : $scope.searchText;
                    $scope.dataFunction($scope.dataCallback, searchText, offSet);
                }
            }

            // Private functions

            function selectionConfirmed(forceClose) {
                var close = false;
                if ($scope.selectedItem) {
                    $scope.confirmedItem = angular.copy($scope.selectedItem);
                    $scope.acuteModel = $scope.selectedItem.value;
                    $scope.comboText = $scope.selectedItem.text;
                    close = true
                }
                else {
                    // Try adding as a custom item
                    if (customAddRequest()) {
                        close = true;
                    }
                }
                if (close || forceClose) {
                    $scope.popupVisible = false;
                    $scope.wrapperFocus = true;
                    // If all data is loaded
                    if ($scope.allDataLoaded && !$scope.settings.comboMode) {
                        // Clear the search text and filter
                        $scope.searchText = "";
                        clearClientFilter();
                    }
                }
            }

            function customAddRequest() {
                var customText;
                var added = false;
                if ($scope.settings.allowCustomText && !$scope.matchFound) {
                    customText = $scope.settings.comboMode ? $scope.comboText : $scope.searchText;
                    if (customText.length > 0) {
                        // Create new data item
                        $scope.acuteModel = {};
                        $scope.acuteModel[$scope.textField] = customText;
                        $scope.selectedItem = { "text": customText, "value": $scope.acuteModel, "index": -1 };
                        added = true;
                    }
                }
                return added;
            }

            function enterKey() {
                selectionConfirmed();
            }

            function downArrowKey() {
                if ($scope.items.length > 0) {
                    var selected = false;
                    if ($scope.selectedItem) {
                        var newIndex = $scope.selectedItem.index + 1;
                        if (newIndex < $scope.items.length) {
                            var targetItem = $scope.items[newIndex];
                            $scope.selectedItem = targetItem;
                            ensureItemVisible($scope.selectedItem);
                            selected = true;
                        }
                        else if ($scope.paging) {
                            $scope.requestedItemIndex = newIndex;
                            $scope.scrollTo += $scope.settings.itemHeight;
                            $scope.loadMore();
                        }
                    }
                    else {
                        // Select first item
                        $scope.selectedItem = $scope.items[0];
                        selected = true;
                    }
                }
            };

            function upArrowKey() {
                if ($scope.items.length > 0) {
                    if ($scope.selectedItem) {
                        var targetItem = $scope.items[$scope.selectedItem.index - 1];
                        if (targetItem) {
                            $scope.selectedItem = targetItem;
                            ensureItemVisible($scope.selectedItem);
                        }
                    }
                    else {
                        if ($scope.comboMode) {
                            $scope.comboFocus = true;
                        }
                        else {
                            $scope.searchBoxFocus = true;
                        }
                    }
                }
            };

            function pageUpKey() {
                if ($scope.items.length > 0 && $scope.selectedItem) {
                    var newIndex = $scope.selectedItem.index - $scope.settings.itemsInView;
                    if (newIndex < 0) newIndex = 0;
                    var targetItem = $scope.items[newIndex];
                    if (targetItem) {
                        $scope.selectedItem = targetItem;
                        ensureItemVisible($scope.selectedItem);
                    }
                }
            };

            function pageDownKey() {
                var newIndex;
                if ($scope.items.length > 0) {
                    if ($scope.selectedItem) {
                        newIndex = $scope.selectedItem.index + $scope.settings.itemsInView;
                    }
                    else {
                        newIndex = $scope.settings.itemsInView - 1;
                    }
                    // If past the end
                    if (newIndex >= $scope.items.length) {
                        if ($scope.allDataLoaded) {
                            newIndex = $scope.items.length - 1;
                        }
                        else {

                        }
                    }
                    var targetItem = $scope.items[newIndex];
                    if (targetItem) {
                        $scope.selectedItem = targetItem;
                        ensureItemVisible($scope.selectedItem);
                    }
                }
            };

            function endKey() {
                if ($scope.items.length > 0) {
                    $scope.selectedItem = $scope.items[$scope.items.length - 1];
                    var totalHeight = $scope.settings.itemHeight * $scope.items.length;
                    $scope.scrollTo = totalHeight - $scope.listHeight;
                }
            }

            function homeKey() {
                if ($scope.items.length > 0) {
                    $scope.selectedItem = $scope.items[0];
                    $scope.scrollTo = 0;
                }
            }

            function escapeKey() {
                // Revert to last confirmed selection
                $scope.selectedItem = $scope.confirmedItem;
                selectionConfirmed(true);
            }

            function deleteKey(event) {
                if ($scope.settings.allowClear) {
                    var srcElement = angular.element(event.target);
                    if (srcElement.hasClass('acute-select-text')) {
                        event.stopPropagation = true;
                    }
                    else {
                        clearSelection();
                    }
                }
            }

            function clearSelection() {
                $scope.selectedItem = null;
                $scope.acuteModel = null;
                $scope.scrollTo = 0;
                $scope.comboText = "";
            }

            function ensureItemVisible(item) {
                var itemHeight = $scope.settings.itemHeight;
                var itemTop = itemHeight * item.index;
                if (itemTop + itemHeight > $scope.listHeight + $scope.scrollPosition) {
                    $scope.scrollTo = itemTop + itemHeight - $scope.listHeight;
                }
                else if (itemTop < $scope.scrollPosition) {
                    $scope.scrollTo = itemTop;
                }
            }

            function filterData(searchText) {
                $scope.showLoadingMessage = false;
                $scope.selectedItem = null;
                if ($scope.allDataLoaded) {
                    if ($scope.settings.filterType == "contains") {
                        $scope.items = $filter("filter")($scope.allItems, searchText);
                    }
                    else {
                        $scope.items = $filter("filter")($scope.allItems, function (item) {
                            // Check for match at start of items only
                            return item.text.substr(0, searchText.length).toLowerCase() === searchText.toLowerCase();
                        });
                    }
                    // Update indexes
                    angular.forEach($scope.items, function (item, index) {
                        item.index = index;
                    });
                }
                else {
                    // Pass search text to data function (if it takes 2 or more arguments)
                    $scope.items = [];
                    if ($scope.dataFunction && $scope.dataFunction.length >= 2
                        && searchText.length >= $scope.settings.minSearchLength) {
                        $scope.dataFunction($scope.dataCallback, searchText, 0);
                    }
                }

                $scope.setListHeight();

                // If narrowed down to one item, select it
                if ($scope.items.length === 1) {
                    $scope.matchFound = true;
                    $scope.selectedItem = $scope.items[0];
                }
                else {
                    $scope.matchFound = false;
                }
            }

            // Remove any client filtering of items
            function clearClientFilter() {
                if ($scope.allDataLoaded) {
                    $scope.items = $scope.allItems;
                    $scope.setListHeight();
                }
            }

            function closeWhenClickingElsewhere(event, callbackFn) {

                var element = event.target;
                if (!element) return;

                var clickedOnPopup = false;
                // Check up to 10 levels up the DOM tree
                for (var i = 0; i < 10 && element && !clickedOnPopup; i++) {
                    var elementClasses = element.classList;
                    if (elementClasses.contains('acute-select-wrapper')) {
                        clickedOnPopup = true;
                    }
                    else {
                        element = element.parentElement;
                    }
                }

                if (!clickedOnPopup) {
                    callbackFn();
                }
            }
        }
    };
});