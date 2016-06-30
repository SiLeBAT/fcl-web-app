'use strict';

/*global angular*/

angular.module('app').component('main', {
    bindings: {},
    controller: function($mdSidenav, dataProvider, graph) {
        this.toogleList = function() {
            $mdSidenav('sidenav').toggle();
        };

        this.nodeSize = 50;

        graph.init(dataProvider.getNodes(), dataProvider.getEdges());

        this.onNodeSizeChange = function(size) {
            this.nodeSize = size;
            graph.setNodeSize(size);
        };
    },
    template: '' +
        '<md-toolbar layout="row" class="md-whiteframe-4dp">' +
        '   <md-button class="menu" aria-label="Menu" ng-click="$ctrl.toogleList()" hide-gt-sm>' +
        '       <md-icon md-svg-icon="menu"></md-icon>' +
        '   </md-button>' +
        '   <div class="md-toolbar-tools">' +
        '       <span>FoodChain-Lab</span>' +
        '   </div>' +
        '</md-toolbar>' +
        '' +
        '<div class="container" layout="row" flex>' +
        '   <md-sidenav md-component-id="sidenav" class="md-whiteframe-4dp" md-is-locked-open="$mdMedia(\'gt-sm\')" flex>' +
        '       <settings node-size="$ctrl.nodeSize" on-change="$ctrl.onNodeSizeChange(value)"></settings>' +
        '   </md-sidenav>' +
        '   <div id="graph" flex></div>' +
        '</div>'
});