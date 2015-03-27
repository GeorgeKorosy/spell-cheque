angular.module("spellChequeDirective", [])

.directive("selectOnClick", function () {
  return {
      restrict: "A",
      link: function (scope, element, attrs) {
          element.on('click', function ($event) { $event.target.select(); });
      }
  };
});