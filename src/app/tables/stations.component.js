'use strict';

/*global angular*/

angular.module('app').component('stations', {
    controller: function(dataService, tableService) {
        var _this = this;
        var _allStations = [];

        function getFilteredStations() {
            return _this.showTraceOnly ? tableService.getElementsOnTrace(_allStations) : _allStations;
        }

        _this.stations = getFilteredStations();
        _this.order = "data.id";
        _this.showTraceOnly = dataService.getTableSettings().showTraceOnly;

        _this.getCellStyle = function(station, position) {
            return tableService.getCellStyle(station, position);
        };

        _this.getRowStyle = function(station) {
            return tableService.getRowStyle(station);
        };

        _this.onChange = function(property, value) {
            switch (property) {
                case "showTraceOnly":
                    _this.showTraceOnly = value;
                    _this.stations = getFilteredStations();
                    break;
            }

            dataService.getTableSettings()[property] = value;
        };

        dataService.getData().then(function(data) {
            _allStations = data.stations;
            _this.stations = getFilteredStations();
        });
    },
    templateUrl: 'app/tables/stations.component.html'
});
