/// <reference path="../lib/angular.1.2.26.js" />

// Directive that creates a searchable dropdown list.

// Associated attributes:-
// ac-model - use instead of ng-model
// ac-options - use instead of ng-options.

// Example:- <select class="ac-select" ac-model="colour" ac-options="c.name for c in colours"></select>

// Note:- ac-options works like ng-options, but does not support option groups

angular.module("acute.select", [])
.directive("acSelect", function($parse, acuteSelectService) {
    var defaultSettings = acuteSelectService.getSettings();
    return {
        restrict: "EAC",
        scope: {
            "acSettings": "@",
            "acOptions": "@",
            "model": "=acModel",
            "acChange": "&",
            "keyField": "@acKey",
            "acRefresh": "=",
            "acFocusWhen": "="
        },
        replace: true,
        templateUrl: defaultSettings.templatePath + "acute.select.htm",
        link: function(scope, element, attrs) {
            scope.initialise();
        },
        // **************************************************************
        //                          CONTROLLER
        // **************************************************************
        controller: function($scope, $element, $window, $rootScope, $timeout, $filter, navKey, safeApply) {

            $scope.initialise = function() {
                $scope.settings = acuteSelectService.getSettings();
                $scope.previousSearchText = "";
                $scope.searchText = "";
                $scope.longestText = "";
                $scope.comboText = "";
                $scope.items = [];
                $scope.allItems = [];        // Unfiltered
                $scope.selectedItem = null;
                $scope.allDataLoaded = false;
                $scope.scrollTo = 0;         // To change scroll position
                $scope.scrollPosition = 0;   // Reported scroll position
                $scope.listHeight = 0;
                $scope.matchFound = false;

                // Check that ac-options and ac-model values are set
                if (!$scope.acOptions || $scope.model === undefined) {
                    throw "ac-model and ac-options attributes must be set";
                }

                processSettings();

                // Parse acOptions

                // Value should be in the form "label for value in array" or "for value in array"
                var words = $scope.acOptions.split(' ');
                var len = words.length;
                $scope.textField = null;
                $scope.dataFunction = null;

                if (len > 3) {
                    if (len > 4) {
                        var label = words[len - 5];     // E.g. colour.name
                        $scope.textField = label.split(".")[1];
                    }
                    var dataName = words[len - 1];

                    // See if a data load function is specified, i.e. name ends in "()"
                    if (dataName.indexOf("()") === dataName.length - 2) {
                        dataName = dataName.substr(0, dataName.length - 2)
                        // Get a reference to the data function
                        var dataFunction = $scope.$parent.$eval(dataName);
                        if (typeof dataFunction === "function") {
                            $scope.dataFunction = dataFunction;
                            if ($scope.settings.loadOnCreate) {
                                // Load initial data (args are callback function, search text and item offset)
                                $scope.dataFunction($scope.dataCallback, "", 0);
                            }
                        }
                        else {
                            throw "Invalid data function: " + dataName;
                        }
                    }
                    else {
                        // Get the data from the parent $scope
                        var dataItems = $scope.$parent.$eval(dataName);
                        loadStaticData(dataItems);
                        // Watch for any change to the data
                        $scope.$parent.$watch(dataName, function(newVal, oldVal) {
                            if (newVal !== oldVal && angular.isArray(newVal)) {
                                loadStaticData(newVal)
                            }
                        });
                    }
                }

                // Save initial selection, if any
                $scope.setInitialSelection();
            };

            function loadStaticData(dataItems) {
                // Create dropdown items
                $scope.loadItems(dataItems, $scope.model);
                // Save selected item
                $scope.confirmedItem = angular.copy($scope.selectedItem);
                $scope.allDataLoaded = $scope.items.length > 0;
            }

            // If the ac-refresh attribute is set, watch it. If its value gets set to true, re-initialise.
            if ($scope.acRefresh !== undefined) {
                $scope.$watch("acRefresh", function(newValue, oldValue) {
                    if (newValue === true) {
                        $scope.initialise();
                    }
                });
            }

            // Handle ac-focus-when attribute. When set to true
            // give focus to either the combo or search text box
            if ($scope.acFocusWhen !== undefined) {
                $scope.$watch("acFocusWhen", function(newValue, oldValue) {
                    if (newValue === true) {
                        // Set flag to fire the ac-focus directive
                        if ($scope.settings.comboMode) {
                            $scope.comboFocus = true;
                        }
                        else {
                            $scope.searchBoxFocus = true;
                        }
                        $scope.acFocusWhen = false;
                    }
                });
            }

            $scope.setInitialSelection = function() {
                if ($scope.model) {
                    $scope.initialSelection = angular.copy($scope.model);
                    $scope.initialItem = $scope.getItemFromDataItem($scope.model, 0);
                    $scope.confirmedItem = $scope.selectedItem = $scope.initialItem;
                    $scope.comboText = $scope.confirmedItem ? $scope.confirmedItem.text : "";
                }
            };

            // Create dropdown items based on the source data items
            $scope.loadItems = function(dataItems, selectedDataItem) {
                var itemCount, itemIndex, item, key = $scope.keyField;

                if (angular.isArray(dataItems)) {

                    var foundSelected = false;
                    itemCount = $scope.items.length;

                    angular.forEach(dataItems, function(dataItem, index) {
                        itemIndex = itemCount + index;
                        item = $scope.getItemFromDataItem(dataItem, itemIndex);
                        if (item) {
                            $scope.items.push(item);
                            // If not currently filtering
                            if (!$scope.searchText) {
                                // Look for a matching item
                                if (dataItem === selectedDataItem || (key && selectedDataItem && dataItem[key] == selectedDataItem[key])) {
                                    confirmSelection(item);
                                    foundSelected = true;
                                }
                            }
                            else if ($scope.searchText.toLowerCase() === item.text.toLowerCase()) {
                                // Search text matches item
                                confirmSelection(item);
                            }

                            if (item.text.length > $scope.longestText.length) {
                                if ($scope.maxCharacters && item.text.length > $scope.maxCharacters) {
                                    $scope.longestText = item.text.substr(0, $scope.maxCharacters);
                                }
                                else {
                                    $scope.longestText = item.text;
                                }
                            }
                        }
                    });

                    // If not currently filtering and there's no selected item, but we have an initial selection
                    if (!$scope.searchText && $scope.initialSelection && !foundSelected) {
                        // Create a new item
                        item = $scope.getItemFromDataItem($scope.initialSelection, 0);
                        if (item) {
                            // Add it to the start of the items array
                            $scope.items.unshift(item);
                            // Update indexes
                            angular.forEach($scope.items, function(item, index) {
                                item.index = index;
                            });

                            confirmSelection(item);
                        }
                    }

                    // If data is not filtered
                    if (!$scope.searchText) {
                        angular.copy($scope.items, $scope.allItems);
                    }

                    $scope.setListHeight();

                    checkItemCount($scope.items);
                }
            };

            function processSettings() {
                if ($scope.acSettings) {
                    var settings = $scope.$eval($scope.acSettings);
                    if (typeof settings === "object") {
                        // Merge settings with default values
                        angular.extend($scope.settings, settings);
                    }
                }
                $scope.longestText = $scope.settings.placeholderText;

                $scope.maxTextWidth = "";

                // If maxWidth is set, limit textbox size, allowing room for dropdown icon
                if ($scope.settings.maxWidth) {
                    var maxWidth = parseInt($scope.settings.maxWidth);
                    // Set an approximate limit to the number of characters to allow in $scope.longestText
                    $scope.maxCharacters = Math.round(maxWidth / 6);
                    $scope.maxTextWidth = (maxWidth - 100) + "px";
                }
            }

            function checkItemCount() {
                $scope.noItemsFound = $scope.items.length === 0;
                $scope.noItemsAdditional = "";
                // If no item is found clear the selected item
                if ($scope.noItemsFound) {
                    $scope.selectedItem = null;
                    if ($scope.settings.comboMode && $scope.comboText && $scope.settings.allowCustomText) {
                        $scope.noItemsAdditional = "Press Enter to Add.";
                    }
                }
            }

            $scope.getItemFromDataItem = function(dataItem, itemIndex) {
                var item = null;
                if (dataItem !== null) {
                    if ($scope.textField === null || $scope.textField === undefined && typeof dataItem === 'string') {
                        item = { "text": dataItem, "value": dataItem, "index": itemIndex };
                    }
                    else if (dataItem[$scope.textField]) {
                        item = { "text": dataItem[$scope.textField], "value": dataItem, "index": itemIndex };
                    }
                }
                return item;
            };

            // Set height of list according to number of visible items
            $scope.setListHeight = function() {
                var itemCount = $scope.items.length;
                if (itemCount > $scope.settings.itemsInView) {
                    itemCount = $scope.settings.itemsInView;
                }

                $scope.listHeight = $scope.settings.itemHeight * itemCount;
            };

            $scope.$watch("model", function(newValue, oldValue) {
                if ($scope.modelUpdating) {
                    $scope.modelUpdating = false;
                }
                else if (!newValue && !oldValue) {
                    // Do nothing
                }
                else if (newValue && !oldValue) {
                    // Model no longer null
                    $scope.setInitialSelection();
                }
                else if (oldValue && !newValue) {
                    // Model cleared
                    $scope.setInitialSelection();
                }
                else {
                    // Check that the text is different
                    if (!$scope.textField || newValue[$scope.textField] !== oldValue[$scope.textField]) {
                        // Model has been changed in the parent scope
                        $scope.setInitialSelection();
                    }
                }
            });

            if ($scope.selectedItem) {
                $scope.comboText = $scope.selectedItem.text;
            }

            // Close all instances when user clicks elsewhere
            $window.onclick = function(event) {
                closeWhenClickingElsewhere(event, function() {
                    $scope.sentBroadcast = false;
                    $rootScope.$broadcast("ac-select-close-all");
                });
            };

            // Keyboard events
            $scope.keyHandler = function(event) {

                if (!$scope.settings.showSearchBox) {
                    handleCharCodes(event);
                }

                var keyCode = event.which || event.keyCode;

                if (keyCode === navKey.downArrow) {
                    $scope.popupVisible = true;
                }

                if ($scope.popupVisible || keyCode === navKey.del) {
                    var stopPropagation = true;
                    switch (keyCode) {
                        case navKey.downArrow:
                            downArrowKey();
                            break;
                        case navKey.upArrow:
                            upArrowKey();
                            break;
                        case navKey.enter:
                            enterKey();
                            break;
                        case navKey.end:
                            endKey();
                            break;
                        case navKey.home:
                            homeKey();
                            break;
                        case navKey.escape:
                            escapeKey();
                            break;
                        case navKey.del:
                            deleteKey(event);
                            break;
                        case navKey.pageUp:
                            pageUpKey();
                            break;
                        case navKey.pageDown:
                            pageDownKey();
                            break;
                        default:
                            stopPropagation = false;
                            break;
                    }

                    if (stopPropagation) event.stopPropagation();
                }
            };

            function handleCharCodes(event) {
                var character, i, item;
                if (event.keyCode) {
                    character = String.fromCharCode(event.keyCode);
                    for (i = 0; i < $scope.items.length; i++) {
                        item = $scope.items[i];
                        if (item.text.length > 0 && item.text.substr(0, 1).toUpperCase() === character) {
                            $scope.selectedItem = item;
                        }
                    }
                }
            }

            // Callback function to receive async data
            $scope.dataCallback = function(data, searchText, offset) {

                // Quit if search text has changed since the data function was called
                if (searchText !== undefined && searchText !== $scope.searchText) {
                    return;
                }

                var selectedDataItem = null;

                $scope.dataItems = data;

                // If we have a selected item, get its value
                if ($scope.selectedItem !== null) {
                    selectedDataItem = $scope.selectedItem.value;
                }
                else {
                    selectedDataItem = $scope.model;
                }

                // Clear all existing items, unless offset > 0, i.e. we're paging and getting additional items
                if (!offset || offset == 0) {
                    $scope.items = [];
                }

                $scope.loadItems(data, selectedDataItem);

                // If not in paging mode
                if (!$scope.settings.pageSize) {
                    // All data is now loaded
                    $scope.allDataLoaded = true;
                    // Clear loadOnOpen flag to avoid re-loading when dropdown is next opened
                    $scope.settings.loadOnOpen = false;
                }
                else {

                    // All data is loaded if fewer than [pageSize] items were returned
                    $scope.allDataLoaded = data.length < $scope.settings.pageSize;

                    // If user was scrolling down
                    if ($scope.requestedItemIndex) {
                        // Select first of the newly loaded items (if present)
                        if ($scope.requestedItemIndex < $scope.items.length) {
                            $scope.selectedItem = $scope.items[$scope.requestedItemIndex];
                            ensureItemVisible($scope.selectedItem);
                        }
                        $scope.requestedItemIndex = null;
                    }
                }

                if ($scope.allDataLoaded) {
                    $scope.previousSearchText = $scope.searchText;
                }

                $scope.loading = false;
                $scope.loadMessage = "Load more...";

            };

            $scope.findData = function() {
                filterData($scope.searchText);
            };

            $scope.comboTextChange = function() {
                $scope.popupVisible = true;
                $scope.ensureDataLoaded();
                $scope.searchText = $scope.comboText;
                if ($scope.comboText == '' && $scope.settings.allowClear) {
                    clearSelection();
                }

                filterData($scope.comboText);
            };

            // Show/hide popup
            $scope.togglePopup = function() {
                $scope.popupVisible = !$scope.popupVisible;
                if ($scope.popupVisible) {
                    // Pop-up opening
                    if ($scope.settings.comboMode) {
                        $timeout(function() { $scope.comboFocus = true; });
                    }
                    else {
                        $timeout(function() { $scope.searchBoxFocus = true; });
                    }
                    $scope.ensureDataLoaded();
                    clearClientFilter();
                }
            };

            $scope.ensureDataLoaded = function() {
                if (!$scope.allDataLoaded && $scope.dataFunction && $scope.settings.loadOnOpen) {
                    // Load initial data (args are callback function, search text and item offset)
                    $scope.dataFunction($scope.dataCallback, "", 0);
                }
            };

            // When clicking on the ac-select-main div
            $scope.mainClick = function() {
                // Close any other ac-select instances
                $scope.sentBroadcast = true;
                $rootScope.$broadcast("ac-select-close-all");
            };

            $scope.$on("ac-select-close-all", function() {
                if (!$scope.sentBroadcast && $scope.popupVisible) {
                    $scope.popupVisible = false;
                    safeApply($scope);
                    // If clear is not allowed and we're in combo mode
                    if (!$scope.settings.allowClear && $scope.settings.comboMode && $scope.selectedItem) {
                        // Update the combo text to reflect the currently selected item
                        $scope.comboText = $scope.confirmedItem.text;
                    }
                }
                else {
                    $scope.sentBroadcast = false;
                }
            });

            $scope.itemClick = function(i) {
                confirmSelection($scope.items[i]);
            };

            $scope.getItemClass = function(i) {
                if ($scope.selectedItem && $scope.items[i].value === $scope.selectedItem.value) {
                    return "ac-select-highlight";
                }
                else {
                    return "";
                }
            };

            $scope.addButtonClick = function() {
                if (customAddRequest()) {
                    confirmSelection(null);
                }
            };

            $scope.listScrolled = function(scrollPosition) {
                $scope.scrollPosition = scrollPosition;
                if ($scope.settings.pageSize) {
                    var totalHeight = $scope.items.length * $scope.settings.itemHeight;
                    // If scrolled past the last item
                    if (scrollPosition > totalHeight - $scope.listHeight) {
                        $scope.loadMore();
                    }
                }
            };

            // Load further data when paging is enabled
            $scope.loadMore = function() {
                if (!$scope.loading) {
                    $scope.loading = true;
                    $scope.loadMessage = "Loading...";

                    var offSet = $scope.items.length;
                    $scope.dataFunction($scope.dataCallback, $scope.searchText, offSet);
                }
            }

            // Private functions

            function confirmSelection(item, forceClose) {

                $scope.selectedItem = item;

                var oldConfirmedItem = $scope.confirmedItem;
                var close = false;
                if ($scope.selectedItem) {
                    $scope.confirmedItem = angular.copy($scope.selectedItem);
                    $scope.modelUpdating = true;
                    $scope.model = $scope.selectedItem.value;
                    $scope.comboText = $scope.selectedItem.text;
                    close = true;
                }
                else {
                    // Try adding as a custom item
                    if (customAddRequest()) {
                        close = true;
                    }
                }

                // If the pop-up is visible (i.e. not setting an initial selection)
                if ($scope.popupVisible) {
                    fireChangeEvent();
                }

                // Clear any initial selection                
                $scope.initialSelection = null;
                $scope.initialItem == null;

                if ($scope.popupVisible && (close || forceClose)) {
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

            function fireChangeEvent() {
                // Fire acChange function, if specified
                if (typeof $scope.acChange === 'function') {
                    $scope.acChange({ value: $scope.selectedItem ? $scope.selectedItem.value : null });
                }
            }

            function customAddRequest() {
                var customText, dataItem;
                var added = false;
                if ($scope.settings.allowCustomText && !$scope.matchFound) {
                    customText = $scope.searchText;
                    if (customText.length > 0) {
                        // Create new data item
                        dataItem = {};
                        dataItem[$scope.textField] = customText;

                        // add the key field if it is defined.
                        if ($scope.keyField) {
                            dataItem[$scope.keyField] = customText;
                        }
                        $scope.modelUpdating = true;
                        $scope.model = dataItem;
                        $scope.confirmedItem = $scope.selectedItem = { "text": customText, "value": dataItem, "index": -1 };
                        $scope.items.push($scope.selectedItem);
                        $scope.allItems.push($scope.selectedItem);
                        added = true;
                    }
                }
                return added;
            }

            function enterKey() {
                confirmSelection($scope.selectedItem);
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
                        else if ($scope.settings.pageSize && $scope.items.length >= $scope.settings.pageSize) {
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
                        if ($scope.settings.comboMode) {
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
                confirmSelection($scope.selectedItem, true);
            }

            function deleteKey(event) {
                if ($scope.settings.allowClear) {
                    var srcElement = angular.element(event.target);
                    // If in combo textbox, ignore
                    if (srcElement.hasClass('ac-select-text')) {
                        event.stopPropagation();
                    }
                    else {
                        clearSelection();
                    }
                }
            }

            function clearSelection() {
                var oldConfirmedItem = $scope.confirmedItem;
                $scope.selectedItem = null;
                $scope.confirmedItem = null;
                $scope.modelUpdating = true;
                $scope.model = null;
                $scope.initialSelection = null;
                $scope.scrollTo = 0;
                $scope.comboText = "";

                if (oldConfirmedItem !== null) {
                    fireChangeEvent();
                }
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

            function filterData() {

                var itemCount = $scope.allItems.length;

                // If search text is blank OR paging is enabled && current number of items is >= pageSize (or zero)
                if ($scope.searchText === "" || ($scope.settings.pageSize && (itemCount >= $scope.settings.pageSize || itemCount === 0))) {
                    // Data needs to be re-loaded.
                    $scope.allDataLoaded = false;
                }

                if ($scope.allDataLoaded) {

                    var itemsToFilter = $scope.allItems;

                    // If search text includes the previous search
                    if ($scope.previousSearchText && $scope.searchText.indexOf($scope.previousSearchText) != -1) {
                        // We can refine the filtering, without checking all items
                        itemsToFilter = $scope.items;
                    }

                    if ($scope.settings.filterType == "contains") {
                        $scope.items = $filter("filter")(itemsToFilter, function(item) {
                            // Check for match at start of items only
                            return item.text.toLowerCase().indexOf($scope.searchText.toLowerCase()) > -1;
                        });
                    }
                    else {
                        $scope.items = $filter("filter")(itemsToFilter, function(item) {
                            // Check for match at start of items only
                            return item.text.substr(0, $scope.searchText.length).toLowerCase() === $scope.searchText.toLowerCase();
                        });
                    }
                    // Update indexes
                    angular.forEach($scope.items, function(item, index) {
                        item.index = index;
                    });

                    checkItemCount();
                }
                else {
                    // Pass search text to data function (if it takes 2 or more arguments)
                    if ($scope.dataFunction && $scope.dataFunction.length >= 2) {
                        // If search text has enough chars (or it's just been cleared)
                        if ($scope.searchText.length >= $scope.settings.minSearchLength || $scope.searchText == "") {
                            // Get data
                            $scope.dataFunction($scope.dataCallback, $scope.searchText, 0);
                        }
                    }
                }

                // If narrowed down to one item (and search text isn't a subset of the previous search), select it
                if ($scope.items.length === 1 && $scope.previousSearchText.indexOf($scope.searchText) === -1) {
                    $scope.matchFound = true;
                    $scope.selectedItem = $scope.items[0];
                }
                else {
                    // See if the search text exactly matches one of the items
                    $scope.matchFound = searchTextMatchesItem();
                }

                $scope.previousSearchText = $scope.searchText
                $scope.setListHeight();
            }

            // Look for an item with text that exactly matches the search text
            function searchTextMatchesItem() {
                var i, valid = false;
                if ($scope.searchText.length > 0) {
                    for (i = 0; i < $scope.items.length; i++) {
                        if ($scope.searchText.toLowerCase() === $scope.items[i].text.toLowerCase()) {
                            $scope.selectedItem = $scope.items[i];
                            $scope.searchText = $scope.comboText = $scope.selectedItem.text;
                            valid = true;
                            break;
                        }
                    }
                }
                return valid;
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
                    if (elementClasses !== undefined && elementClasses.contains('ac-select-wrapper')) {
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

            function log(text) {
                if (console && console.log && $scope.settings.debug) {
                    console.log("ac-select:- " + text);
                }
            }
        }
    };
})

// Directive to set focus to an element when a specified expression is true
.directive('acFocus', function($timeout, $parse, safeApply) {
    return {
        restrict: "A",
        link: function(scope, element, attributes) {
            var setFocus = $parse(attributes.acFocus);
            scope.$watch(setFocus, function(value) {
                if (value === true) {
                    $timeout(function() {
                        element[0].focus();
                    });
                }
            });
            // Set the "setFocus" attribute value to 'false' on blur event
            // using the "assign" method on the function that $parse returns
            element.bind('blur', function() {
                safeApply(scope, function() { setFocus.assign(scope, false) });
            });
        }
    };
})

.directive('acSelectOnFocus', function() {
    return {
        restrict: 'A',
        scope: {
            acSelectOnFocus: "="
        },
        link: function(scope, element, attrs) {
            element.bind('focus', function() {
                if (scope.acSelectOnFocus !== false && scope.acSelectOnFocus !== 'false') {
                    element[0].select();
                }
            });
        }
    };
})

// Directive for a scroll container. Set the "ac-scroll-to" attribute to an expression and when its value changes,
// the div will scroll to that position
.directive('acScrollTo', function() {
    return {
        restrict: "A",
        scope: false,
        controller: function($scope, $element, $attrs) {
            var expression = $attrs.acScrollTo;
            $scope.$watch(expression, function() {
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
.directive('acOnScroll', function() {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            var callbackName = attrs.acOnScroll;
            if (callbackName.indexOf("()") === callbackName.length - 2) {
                callbackName = callbackName.substr(0, callbackName.length - 2);
            }
            var callback = scope[callbackName];
            if (typeof callback === "function") {
                element.bind("scroll", function() {
                    callback(element[0].scrollTop);
                });
            }
        }
    };
})

.factory('navKey', function() {
    return {
        'backspace': 8,
        'tab': 9,
        'enter': 13,
        'escape': 27,
        'pageUp': 33,
        'pageDown': 34,
        'end': 35,
        'home': 36,
        'leftArrow': 37,
        'upArrow': 38,
        'rightArrow': 39,
        'downArrow': 40,
        'del': 46
    };
})

// safeApply service, courtesy Alex Vanston and Andrew Reutter
.factory('safeApply', [function($rootScope) {
    return function($scope, fn) {
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

// Service to allow host pages to change settings for all instances (in their module.run function)
.factory('acuteSelectService', function() {

    var defaultSettings = {
        "templatePath": "/acute.select/",
        "noItemsText": "No items found.",
        "placeholderText": "Please select...",
        "itemHeight": 24,
        "itemsInView": 10,
        "pageSize": null,
        "minWidth": "100px",
        "maxWidth": "",
        "showSearchBox": true,
        "comboMode": false,
        "comboSelectOnFocus": true,
        "loadOnCreate": true,
        "loadOnOpen": false,      // If true, while loadOnCreate is false, the load function will be called when the dropdown opens
        "allowCustomText": false,
        "minSearchLength": 0,
        "filterType": "contains",    // or "start"
        "allowClear": true,
        "debug": false
    };

    return {
        getSettings: function() {
            // Add trailing "/" to template path if not present
            var len = defaultSettings.templatePath.length;
            if (len > 0 && defaultSettings.templatePath.substr(len - 1, 1) !== "/") {
                defaultSettings.templatePath += "/";
            }
            return angular.copy(defaultSettings);
        },

        updateSetting: function(settingName, value) {
            updateSingleSetting(settingName, value);
        },

        updateSettings: function(settings) {
            for (name in settings) {
                updateSingleSetting(name, settings[name]);
            }
        }
    };

    function updateSingleSetting(settingName, value) {
        if (defaultSettings.hasOwnProperty(settingName)) {
            defaultSettings[settingName] = value;
        }
    }
});