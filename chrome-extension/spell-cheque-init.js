angular.module("spellChequeInit", [])

.constant("currencyDescriptorState", {
  defaultSelectionSymbol: "currencyDescriptorState.defaultSelectionSymbol",
  rollCall: []
})
.constant("capitalisationFilterState", {
    defaultSelectionLabel: "capitalisationFilterState.defaultSelectionLabel"
})
.constant("fractionalPresentationState", {
  defaultSelectionLabel: "fractionalPresentationState.defaultSelectionLabel",
  rollCall: []
})
.constant("shortScales", [])

.value("currencyDescriptor", {
  wholeSingular: "currencyDescriptor.wholeSingular",
  wholePlural: "currencyDescriptor.wholePlural",
  fractionalSingular: "currencyDescriptor.fractionalSingular",
  fractionalPlural: "currencyDescriptor.fractionalPlural"
})
.value("rangeCheckLimit", {
    scaleCount: "rangeCheckLimit.scaleCount",
    minimum: "rangeCheckLimit.minimum",
    maximum: "rangeCheckLimit.maximum"
})
.value("numericAmount", {
    whole: null,
    fractional: null
})
.value("alphaAmount", {
    whole: "",
    fractional: ""
})
.value("fractionalPresentation", {
  numeric: false,
  textual: false
})
.value("capitalisationFilter", {
  filter: function (raw) { return raw; }
})

.factory("capitalisationFilterLookup", function capitalisationFiltersFactory () {
  // constants
  var theSmalls = ["and"],
    theSansLeadingBlanks = [","];
      
  var lower = {
    filter: function (raw) { return raw ? raw.toLowerCase() : ""; }
  };
  var sentence = {
    filter: function (raw) {
      return raw ? raw.charAt(0).toUpperCase() + raw.substring(1).toLowerCase() : "";
    }
  };
  var title = {
    filter: function (raw) {
      var result = "";
      if (raw) {
        raw.trim().split(" ").forEach(function (word) {
          if (result && theSansLeadingBlanks.indexOf(word) < 0) {
            result += " ";
          }
          if (theSmalls.indexOf(word.toLowerCase()) < 0) {
            result += word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
          } else {
            result += word.toLowerCase();
          }
        });
      }
      return result;
    }
  };
  var upper = {
    filter: function (raw) { return raw ? raw.toUpperCase() : ""; }
  };
  
  return {lowerCase: lower, sentenceCase: sentence, titleCase: title, upperCase: upper};
})

.run(function ($rootScope, $http,
    currencyDescriptorState, capitalisationFilterState,
    fractionalPresentationState, shortScales, rangeCheckLimit) {
      
  $http.get("spell-cheque.json").success(function (preferences) {

    preferences.currencyDescriptorState.rollCall.forEach(function (element) {
      currencyDescriptorState.rollCall.push(element);
    });

    preferences.fractionalPresentationState.rollCall.forEach(function (element) {
      fractionalPresentationState.rollCall.push(element);
    });

    preferences.shortScales.forEach(function (element) {
      shortScales.push(element);
    });

    currencyDescriptorState.defaultSelectionSymbol
        = preferences.currencyDescriptorState.defaultSelectionSymbol;
    capitalisationFilterState.defaultSelectionLabel
        = preferences.capitalisationFilterState.defaultSelectionLabel;
    fractionalPresentationState.defaultSelectionLabel
        = preferences.fractionalPresentationState.defaultSelectionLabel;

    rangeCheckLimit.scaleCount = preferences.rangeCheckLimit.scaleCount;
    rangeCheckLimit.minimum = preferences.rangeCheckLimit.minimum;
    rangeCheckLimit.maximum = preferences.rangeCheckLimit.maximum;


    $rootScope.$broadcast("jsonLoaded");
  });
});