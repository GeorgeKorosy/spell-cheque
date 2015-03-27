angular.module("spellChequeController", ["spellChequeInit", "spellChequeService"])

.controller("phraseFormatCtlr", [
    "$scope", "$rootScope", "phraseAssembler",
    function ($scope, $rootScope, phraseAssembler) {

  $scope.textifiedCurrency = phraseAssembler.toString();

  $rootScope.$on("rePhraseChq", function () {
    $scope.textifiedCurrency = phraseAssembler.toString();
  });
}])

.controller("spellOutCtrl", ["$scope", "$rootScope", function ($scope, $rootScope) {
  $scope.onReload = function () {
    $rootScope.$broadcast("currencyAmountChanged");
  };
}])

.controller("numberTextifyerCtrl", [
    "$scope", "$rootScope", "numericHandler", "numericAmount", "alphaProducer",
    function ($scope, $rootScope, numericHandler, numericAmount, alphaProducer) {
      $scope.userEntry = "";
      $scope.errorMessage = "";

      $rootScope.$on("currencyAmountChanged", function () {
        try {
          numericHandler.parse($scope.userEntry);
          if (numericAmount.whole === null || numericAmount.fractional=== null) {
            $scope.userEntry = "";
          } else {
            $scope.userEntry = numericAmount.whole+ "." + numericAmount.fractional;

            alphaProducer.spellOutWhole();
            alphaProducer.spellOutFractional();
          }
          $scope.errorMessage = "";
        } catch (error) {
          $scope.errorMessage = error;
        }

        $rootScope.$broadcast("rePhraseChq");
      });
}])

.controller("currencyCtrl", [
    "$scope", "$rootScope", "currencyDescriptorState", "currencyDescriptor",
    function ($scope, $rootScope, currencyDescriptorState, currencyDescriptor) {

  $scope.currencyOptions = [];
  $scope.currencyOption = null;

  var primed = false;

  var update = function (source, target) {
      target.wholeSingular = source.wholeSingular;
      target.wholePlural = source.wholePlural;
      target.fractionalSingular = source.fractionalSingular;
      target.fractionalPlural = source.fractionalPlural;
  };

  $rootScope.$on("jsonLoaded", function () {
    currencyDescriptorState.rollCall.forEach(function (element, index) {
      $scope.currencyOptions.push({label: element.symbol, value: index.toString()});

      if (index === 0 || currencyDescriptorState.defaultSelectionSymbol === element.symbol) {
        $scope.currencyOption = $scope.currencyOptions[index];
        update(element, currencyDescriptor);
      }
    });

    primed = $scope.currencyOptions.length > 0 && $scope.currencyOption !== null;
  });

  $scope.$watch("currencyOption", function () {
    if (primed) {
      update(
        currencyDescriptorState.rollCall[parseInt($scope.currencyOption.value, 10)],
        currencyDescriptor);
      $rootScope.$broadcast("rePhraseChq");
    }
  });
}])

.controller("capitalisationFilterCtlr", [
    "$scope", "$rootScope", "capitalisationFilterState",
    "capitalisationFilter", "capitalisationFilterLookup",
    function ($scope, $rootScope, capitalisationFilterState,
    capitalisationFilter, capitalisationFilterRollCall) {

  $scope.capitalisationFilterOptions = [];
  $scope.capitalisationFilterOption = null;
  var primed = false;

  $rootScope.$on("jsonLoaded", function () {
    function decamelise (arg) {
      // http://stackoverflow.com/questions/4149276/javascript-camelcase-to-regular-form
      return arg.replace(/([a-z])([A-Z])/g, '$1 $2');
    }

    Object.getOwnPropertyNames(capitalisationFilterRollCall).sort().forEach(function (propertyName, index) {
      
      $scope.capitalisationFilterOptions.push(
          capitalisationFilterRollCall[propertyName].filter(decamelise(propertyName)));

      if (index === 0|| $scope.capitalisationFilterOptions[index]
          === capitalisationFilterState.defaultSelectionLabel) {
            
        $scope.capitalisationFilterOption = $scope.capitalisationFilterOptions[index];
        capitalisationFilter.filter = capitalisationFilterRollCall[propertyName].filter;
      }
    });

    primed = $scope.capitalisationFilterOptions.length > 0 && $scope.capitalisationFilterOption !== null;
  });

  $scope.$watch("capitalisationFilterOption", function () {
    // http://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
    function camelise(arg) {
      return arg.toLowerCase()
          .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
          .replace(/\s/g, '')
          .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
    }
    
    if (primed) {
      capitalisationFilter.filter =
          capitalisationFilterRollCall[camelise($scope.capitalisationFilterOption)].filter;
      $rootScope.$broadcast("rePhraseChq");
    }
  });
}])

.controller("fractionalPresentationCtrl", [
    "$scope", "$rootScope", "alphaProducer", "fractionalPresentationState", "fractionalPresentation",
    function ($scope, $rootScope, alphaProducer, fractionalPresentationState, fractionalPresentation) {

  $scope.fractionalPresentationOptions = [];
  $scope.fractionalPresentationOption = null;

  var primed = false;

  var update = function (source, target) {
    target.numeric = source.indexOf("numeric") >= 0;
    target.textual = !target.numeric && source.indexOf("text") >= 0;
  };

  $rootScope.$on("jsonLoaded", function () {
    fractionalPresentationState.rollCall.forEach(function (any, index) {
      $scope.fractionalPresentationOptions.push(any);

      if (any === fractionalPresentationState.defaultSelectionLabel) {
        $scope.fractionalPresentationOption = $scope.fractionalPresentationOptions[index];
        update(any, fractionalPresentation);
      }
    });

    primed = $scope.fractionalPresentationOptions.length > 0 || $scope.fractionalPresentationOption !== null;
  });

  $scope.$watch("fractionalPresentationOption", function () {
    if (primed) {
      update($scope.fractionalPresentationOption, fractionalPresentation);
      alphaProducer.spellOutFractional();

      $rootScope.$broadcast("rePhraseChq");
    }
  });
}]);

