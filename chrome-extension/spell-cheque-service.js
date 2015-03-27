angular.module("spellChequeService", ["spellChequeInit"])

.service("numericHandler", ["shortScales", "rangeCheckLimit", "numericAmount",
    function (shortScales, rangeCheckLimit, numericAmount) {

  function splitToTripleDigits (numberAsText) {
    // http://stackoverflow.com/questions/2254185/regular-expression-for-formatting-numbers-in-javascript
    return numberAsText.split(/(?=(?:\d{3})+(?:\.|$))/g);
  }
  
  function formatIntegerAbsoluteValue (intAsText) {
    if (intAsText.charAt(0) === "-") {
      return intAsText.charAt(0) + formatIntegerAbsoluteValue(intAsText.substring(1));
    }
    var trimmed = intAsText.replace(/^0+/g, "");
    return trimmed.length === 0 ? "0" : trimmed;
  }

  function parseWhole (wholeText) {
    return splitToTripleDigits(
      formatIntegerAbsoluteValue(wholeText)
    ).join(",");
  }

  function parseFractional (fractionalText) {
    if (fractionalText.length === 0) {
      return "00";
    }
    if (fractionalText.length === 1) {
      return fractionalText.charAt(0) + "0";
    }
    return fractionalText.charAt(0) + fractionalText.charAt(1);
  }
  
  function isAutomaticMinimum () {
    return rangeCheckLimit.minimum === "auto";
  }
  
  function isAutomaticMaximum () {
    return rangeCheckLimit.maximum === "auto";
  }
  
  function isAutomaticScaleCount () {
    return rangeCheckLimit.scaleCount === "auto";
  }
  
  function abort(msg) {
    numericAmount.whole = null;
    numericAmount.fractional = null;
    throw (msg);
  }

  function checkRange () {
    if (isAutomaticMinimum()) {
      if (numericAmount.whole.charAt(0) === "-") {
        if (numericAmount.whole === "-0" && numericAmount.fractional === "00") {
          numericAmount.whole = "0";
        } else {
          abort("Must not be negative");
        }
      }
    } else { /* empty block */ }
    
    if (isAutomaticMaximum()) {
      if (isAutomaticScaleCount) {
        if (numericAmount.whole.split(",").length > shortScales.length) {
          abort("Maximum " + (3 * shortScales.length) + " integer digits");
        }
      } else {  /* empty block */  }
    } else {  /* empty block */  }
  }

  return {
    parse: function (rawAmount) {
      if (rawAmount) {
        // remove white space and comma
        var pureAmount = rawAmount.replace(/(\s|,)/g, ""),
          dotAt = pureAmount.indexOf(".");

        if (isNaN(pureAmount)) {
          abort("Not a number");
        }

        if (dotAt < 0) {
          numericAmount.whole = parseWhole(pureAmount);
          numericAmount.fractional = "00";
        } else if (dotAt === 0) {
          numericAmount.whole = "0";
          numericAmount.fractional = parseFractional(pureAmount.substring(1));
        } else if (dotAt === pureAmount.length - 1) {
          numericAmount.whole = parseWhole(pureAmount.substring(0, dotAt));
          numericAmount.fractional = "00";
        } else {
          numericAmount.whole = parseWhole(pureAmount.substring(0, dotAt));
          numericAmount.fractional = parseFractional(pureAmount.substring(dotAt + 1));
        }
        
        checkRange();
      } else {
        numericAmount.whole = null;
        numericAmount.fractional = null;
      }
    }
  };
}])

.service("alphaProducer", [
    "shortScales", "numericAmount", "alphaAmount", "fractionalPresentation",
    function (shortScales, numericAmount, alphaAmount, fractionalPresentation) {
      
  // static constants
  var theSingleDigits = ["zero", "one", "two", "three", "four", "five", "six",
        "seven", "eight", "nine"],
    theDecadeDigits = ["", "ten", "twenty", "thirty", "forty", "fifty", "sixty",
        "seventy", "eighty", "ninety"],
    theTeenDigits = ["ten", "eleven", "twelf", "thirteen", "fourteen",
        "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"],
    theHundred = "hundred",
    theSeparator = "and";

  function spellOutSingleScale (aScale) {
    var last3Digits = Math.abs(aScale) % 1000,
        hundreds = last3Digits < 100  ? 0 : parseInt(aScale.toString().charAt(aScale.toString().length - 3), 10),
        tens = last3Digits < 10 ? 0 : parseInt(aScale.toString().charAt(aScale.toString().length - 2), 10),
        units = parseInt(aScale.toString().charAt(aScale.toString().length - 1), 10),
        result = "";

    if (hundreds > 0) {
        result = theSingleDigits[hundreds] + " " + theHundred;
        if (tens > 0 || units > 0) {
            result += " " + theSeparator + " ";
        }
    }

    if (tens === 1) {
        result += theTeenDigits[units];
    } else {
        if (tens !== 0) {
            result += theDecadeDigits[tens];
            if (units > 0) {
                result += " ";
            }
        }
        if ((hundreds === 0 && tens === 0) || units > 0) {
            result += theSingleDigits[units];
        }
    }

    return result;
  }

  function spellOut (bigIntAsCommaSeparatedText) {
    var scales = bigIntAsCommaSeparatedText.split(","),
      result = "",
      numericScale;

    scales.forEach(function (aScale, index) {
      numericScale = parseInt(aScale, 10);

      if (numericScale > 0 || scales.length === 1) {
        if (index > 0) {
          result += " " + theSeparator + " ";
        }
        result += spellOutSingleScale(numericScale);
        if (shortScales[scales.length - index - 1]) {
            result += " " + shortScales[scales.length - index - 1];
        }        
      }
    });

    return result;
  } // formatMultipleScales()

  return {
    spellOutWhole: function () {
      if (numericAmount.whole === null) {
        alphaAmount.whole = "";
      } else {
        alphaAmount.whole = spellOut(numericAmount.whole);
      }
    },
    spellOutFractional: function () {
      alphaAmount.fractional = "";
      if (numericAmount.whole !== null) {
        if (fractionalPresentation.numeric) {
          alphaAmount.fractional = parseInt(numericAmount.fractional, 10).toString();
        } else if (fractionalPresentation.textual) {
          alphaAmount.fractional = spellOutSingleScale(parseInt(numericAmount.fractional, 10));
        }
      }
    }
  };
}])

.service("phraseAssembler", [
  "numericAmount", "alphaAmount", "currencyDescriptor", "fractionalPresentation", "capitalisationFilter",
  function (numericAmount, alphaAmount, currencyDescriptor, fractionalPresentation, capitalisationFilter) {

  // closures:
  function currencyName () {
    return numericAmount.whole === null ? ""
      : numericAmount.whole === "1"
      ? currencyDescriptor.wholeSingular : currencyDescriptor.wholePlural;
  }

  function changeName () {
    return numericAmount.fractional === null ? ""
      : numericAmount.fractional === "01"
      ? currencyDescriptor.fractionalSingular : currencyDescriptor.fractionalPlural;
  }

  function wholeClause () {
    return alphaAmount.whole + " " + currencyName();
  }

  function fractionalClause () {
    if (numericAmount.fractional === "00") {
      return " only";
    } else if (fractionalPresentation.numeric) {
      return ", " + alphaAmount.fractional + " " + changeName();
    } else if (fractionalPresentation.textual) {
      return " and " + alphaAmount.fractional + " " + changeName();
    }
    return "";
  }

  return {
    toString: function () {
      if (numericAmount.whole === null || numericAmount.fractional === null) {
        return "";
      }
      return capitalisationFilter.filter(wholeClause() + fractionalClause());
    }
  };
}]);
