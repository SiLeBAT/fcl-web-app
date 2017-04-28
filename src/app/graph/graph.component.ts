import {Component, OnInit, ViewChild} from '@angular/core';
import {MdDialog, MdMenuTrigger} from '@angular/material';
import {Observable, Subject} from 'rxjs/Rx';

import {DialogActionsComponent, DialogActionsData} from '../dialog/dialog-actions/dialog-actions.component';
import {DialogPromptComponent, DialogPromptData} from '../dialog/dialog-prompt/dialog-prompt.component';
import {StationPropertiesComponent, StationPropertiesData} from '../dialog/station-properties/station-properties.component';
import {DeliveryPropertiesComponent, DeliveryPropertiesData} from '../dialog/delivery-properties/delivery-properties.component';
import {DataService} from '../util/data.service';
import {UtilService} from '../util/util.service';
import {TracingService} from './tracing.service';
import {CyEdge, CyNode, DeliveryData, FclElements, ObservedType, Size} from '../util/datatypes';

declare const cytoscape: any;
declare const ResizeSensor: any;
declare const html2canvas: any;

enum MenuActionType {
  runAction, openLayoutMenu
}

interface MenuAction {
  name: string;
  type: MenuActionType;
  enabled: boolean;
  action?: () => void;
}

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css']
})
export class GraphComponent implements OnInit {

  private static NODE_SIZES: Map<Size, number> = new Map([
    [Size.SMALL, 50],
    [Size.MEDIUM, 75],
    [Size.LARGE, 100]
  ]);

  private static FONT_SIZES: Map<Size, number> = new Map([
    [Size.SMALL, 10],
    [Size.MEDIUM, 14],
    [Size.LARGE, 18]
  ]);

  @ViewChild('graphMenuTrigger') graphMenuTrigger: MdMenuTrigger;
  @ViewChild('stationMenuTrigger') stationMenuTrigger: MdMenuTrigger;
  @ViewChild('deliveryMenuTrigger') deliveryMenuTrigger: MdMenuTrigger;

  actionTypes = MenuActionType;
  graphMenuActions = this.createGraphActions();
  stationMenuActions = this.createStationActions(null);
  deliveryMenuActions = this.createDeliveryActions(null);
  layoutMenuActions = this.createLayoutActions();

  private cy: any;
  private data: FclElements;
  private mergeMap: Map<string, string[]>;
  private changeFunction: () => void;

  private mergeDeliveries = DataService.DEFAULT_GRAPH_SETTINGS.mergeDeliveries;
  private nodeSize = DataService.DEFAULT_GRAPH_SETTINGS.nodeSize;
  private fontSize = DataService.DEFAULT_GRAPH_SETTINGS.fontSize;
  private showLegend = DataService.DEFAULT_GRAPH_SETTINGS.showLegend;

  private selectTimerActivated = true;
  private resizeTimer: any;
  private selectTimer: any;
  private zoom: Subject<boolean> = new Subject();
  private legend: Subject<string[]> = new Subject();

  private static createNodeBackground(colors: number[][]): any {
    if (colors.length === 1) {
      return {
        'background-color': UtilService.colorToCss(colors[0])
      };
    }

    const style = {};

    for (let i = 0; i < colors.length; i++) {
      style['pie-' + (i + 1) + '-background-color'] = UtilService.colorToCss(colors[i]);
      style['pie-' + (i + 1) + '-background-size'] = 100 / colors.length;
    }

    return style;
  }

  constructor(private tracingService: TracingService, private dialogService: MdDialog) {
  }

  ngOnInit() {
    window.onresize = () => {
      Observable.timer(500).subscribe(() => {
        if (this.cy != null) {
          this.cy.resize();
        }
      });
    };

    new ResizeSensor(document.getElementById('graphContainer'), () => {
      if (this.resizeTimer != null) {
        this.resizeTimer.unsubscribe();
      }

      if (this.cy != null) {
        this.resizeTimer = Observable.timer(100).subscribe(() => this.cy.resize());
      }
    });
  }

  init(data: FclElements, layout: any) {
    this.data = data;
    this.tracingService.init(data);

    this.cy = cytoscape({
      container: document.getElementById('cy'),

      elements: {
        nodes: this.createNodes(),
        edges: this.createEdges()
      },

      layout: layout,
      style: this.createStyle(),
      minZoom: 0.01,
      maxZoom: 10,
      wheelSensitivity: 0.5,
    });

    this.cy.zooming(this.zoom);
    this.cy.legend(this.legend);
    this.cy.on('zoom', () => this.setFontSize(this.fontSize));
    this.cy.on('select', event => this.setSelected(event.cyTarget.id(), true));
    this.cy.on('unselect', event => this.setSelected(event.cyTarget.id(), false));
    this.cy.on('position', event => this.tracingService.getStationsById([event.cyTarget.id()])[0].position = event.cyTarget.position());
    this.cy.on('cxttap', event => {
      const element = event.cyTarget;

      if (!element.hasOwnProperty('length')) {
        UtilService.setElementPosition(document.getElementById('graphMenu'), event.originalEvent.offsetX, event.originalEvent.offsetY);
        this.graphMenuTrigger.openMenu();
      } else if (element.group() === 'nodes') {
        this.stationMenuActions = this.createStationActions(element);
        UtilService.setElementPosition(document.getElementById('stationMenu'), event.originalEvent.offsetX, event.originalEvent.offsetY);
        this.stationMenuTrigger.openMenu();
      } else if (element.group() === 'edges') {
        this.deliveryMenuActions = this.createDeliveryActions(element);
        UtilService.setElementPosition(document.getElementById('deliveryMenu'), event.originalEvent.offsetX, event.originalEvent.offsetY);
        this.deliveryMenuTrigger.openMenu();
      }
    });

    this.setFontSize(this.fontSize);
    this.setShowLegend(this.showLegend);

    for (const s of data.stations) {
      const pos = this.cy.nodes().getElementById(s.id).position();

      if (pos != null) {
        s.position = pos;
      }
    }
  }

  onChange(changeFunction: () => void) {
    this.changeFunction = changeFunction;
  }

  getLayout(): any {
    return {
      name: 'preset',
      zoom: this.cy.zoom(),
      pan: this.cy.pan()
    };
  }

  getCanvas(): Promise<HTMLCanvasElement> {
    return new Promise(resolve => {
      this.zoom.next(false);
      //noinspection JSUnusedGlobalSymbols
      html2canvas(document.getElementById('graphContainer'), {
        onrendered: (canvas) => {
          this.zoom.next(true);
          resolve(canvas);
        }
      });
    });
  }

  setMergeDeliveries(mergeDeliveries: boolean) {
    this.mergeDeliveries = mergeDeliveries;

    if (this.cy != null) {
      this.updateEdges();
    }
  }

  setNodeSize(nodeSize: Size) {
    this.nodeSize = nodeSize;

    if (this.cy != null) {
      this.updateProperties();
    }
  }

  setFontSize(fontSize: Size) {
    this.fontSize = fontSize;

    if (this.cy != null) {
      const size = GraphComponent.FONT_SIZES.get(fontSize);

      this.cy.nodes().style({
        'font-size': Math.max(size / this.cy.zoom(), size)
      });
    }
  }

  setShowLegend(showLegend: boolean) {
    this.showLegend = showLegend;

    if (this.cy != null) {
      this.legend.next(showLegend ? DataService.PROPERTIES_WITH_COLORS : []);
    }
  }

  updateSelection() {
    if (this.cy != null) {
      this.selectTimerActivated = false;

      if (this.mergeDeliveries) {
        this.updateEdges();
        this.cy.batch(() => {
          this.cy.nodes(':selected[!selected]').unselect();
          this.cy.nodes(':unselected[?selected]').select();
        });
      } else {
        this.cy.batch(() => {
          this.cy.elements(':selected[!selected]').unselect();
          this.cy.elements(':unselected[?selected]').select();
        });
      }

      this.selectTimerActivated = true;
    }
  }

  private createNodes(): CyNode[] {
    const nodes: CyNode[] = [];

    for (const s of this.data.stations) {
      if (!s.contained && !s.invisible) {
        nodes.push({
          group: 'nodes',
          data: s,
          selected: s.selected,
          position: s.position
        });
      }
    }

    return nodes;
  }

  private createEdges(): CyEdge[] {
    const edges: CyEdge[] = [];

    this.mergeMap = new Map();

    if (this.mergeDeliveries) {
      const sourceTargetMap: Map<string, DeliveryData[]> = new Map();

      for (const d of this.data.deliveries) {
        if (!d.invisible) {
          const key = d.source + '->' + d.target;
          const value = sourceTargetMap.get(key);

          sourceTargetMap.set(key, value == null ? [d] : value.concat(d));
        }
      }

      sourceTargetMap.forEach((value, key) => {
        if (value.length === 1) {
          edges.push({
            group: 'edges',
            data: value[0],
            selected: value[0].selected,
          });
        } else {
          const observedElement = value.find(d => d.observed !== ObservedType.NONE);
          const selected = value.find(d => d.selected) != null;

          this.mergeMap.set(key, value.map(d => d.id));
          edges.push({
            group: 'edges',
            data: {
              id: key,
              source: value[0].source,
              target: value[0].target,
              originalSource: value[0].source,
              originalTarget: value[0].target,
              invisible: false,
              selected: selected,
              observed: observedElement != null ? observedElement.observed : ObservedType.NONE,
              forward: value.find(d => d.forward) != null,
              backward: value.find(d => d.backward) != null,
              score: 0,
              properties: []
            },
            selected: selected
          });
        }
      });
    } else {
      for (const d of this.data.deliveries) {
        if (!d.invisible) {
          edges.push({
            group: 'edges',
            data: d,
            selected: d.selected,
          });
        }
      }
    }

    return edges;
  }

  private updateEdges() {
    this.cy.batch(() => {
      this.cy.edges().remove();
      this.cy.add(this.createEdges());
    });
  }

  private updateProperties() {
    if (this.mergeDeliveries) {
      this.updateEdges();
      this.cy.nodes().scratch('_update', true);
    } else {
      this.cy.elements().scratch('_update', true);
    }
  }

  private updateAll() {
    for (const s of this.data.stations) {
      if (!s.contained && s.positionRelativeTo != null) {
        s.position = UtilService.sum(this.cy.nodes().getElementById(s.positionRelativeTo).position(), s.position);
      } else if (s.position == null && s.contains != null) {
        s.position = UtilService.getCenter(s.contains.map(id => this.tracingService.getStationsById([id])[0].position));

        for (const contained of this.tracingService.getStationsById(s.contains)) {
          contained.positionRelativeTo = s.id;
          contained.position = UtilService.difference(contained.position, s.position);
        }
      }
    }

    this.cy.batch(() => {
      this.cy.elements().remove();
      this.cy.add(this.createNodes());
      this.cy.add(this.createEdges());
      this.setFontSize(this.fontSize);
    });
  }

  private createStyle(): any {
    const sizeFunction = node => {
      const size = GraphComponent.NODE_SIZES.get(this.nodeSize);

      if (this.tracingService.getMaxScore() > 0) {
        return (0.5 + 0.5 * node.data('score') / this.tracingService.getMaxScore()) * size;
      } else {
        return size;
      }
    };

    let style = cytoscape.stylesheet()
      .selector('node')
      .style({
        'content': 'data(name)',
        'height': sizeFunction,
        'width': sizeFunction,
        'background-color': '#FFFFFF',
        'border-width': 3,
        'border-color': '#000000',
        'text-valign': 'bottom',
        'text-halign': 'right',
        'color': '#000000',
        'font-family': 'Roboto, Helvetica Neue, sans-serif'
      })
      .selector('edge')
      .style({
        'target-arrow-shape': 'triangle',
        'width': 6,
        'line-color': '#000000',
        'target-arrow-color': '#FF0000',
        'curve-style': 'bezier'
      })
      .selector('node:selected')
      .style({
        'background-color': '#8080FF',
        'border-width': 6,
        'border-color': '#0000FF',
        'color': '#0000FF'
      })
      .selector('edge:selected')
      .style({
        'width': 12
      })
      .selector('node[?contains]')
      .style({
        'border-width': 6
      })
      .selector('node:selected[?contains]')
      .style({
        'border-width': 9
      });

    const createSelector = (prop: string) => {
      if (prop === 'observed') {
        return '[' + prop + ' != "' + ObservedType.NONE + '"]';
      } else {
        return '[?' + prop + ']';
      }
    };

    for (const combination of UtilService.getAllCombinations(DataService.PROPERTIES_WITH_COLORS)) {
      const s = [];
      const c1 = [];
      const c2 = [];

      for (const prop of combination) {
        const color = DataService.PROPERTIES.get(prop).color;

        s.push(createSelector(prop));
        c1.push(color);
        c2.push(UtilService.mixColors(color, [0, 0, 255]));
      }

      style = style.selector('node' + s.join('')).style(GraphComponent.createNodeBackground(c1));
      style = style.selector('node:selected' + s.join('')).style(GraphComponent.createNodeBackground(c2));
    }

    for (const prop of DataService.PROPERTIES_WITH_COLORS) {
      style = style.selector('edge' + createSelector(prop)).style({
        'line-color': UtilService.colorToCss(DataService.PROPERTIES.get(prop).color)
      });
    }

    return style;
  }

  private setSelected(id: string, selected: boolean) {
    if (this.mergeMap.has(id)) {
      for (const containedId of this.mergeMap.get(id)) {
        this.tracingService.setSelected(containedId, selected);
      }
    } else {
      this.tracingService.setSelected(id, selected);
    }

    if (this.selectTimerActivated) {
      if (this.selectTimer != null) {
        this.selectTimer.unsubscribe();
      }

      this.selectTimer = Observable.timer(50).subscribe(() => this.callChangeFunction());
    }
  }

  private createGraphActions(): MenuAction[] {
    return [
      {
        name: 'Apply Layout',
        type: MenuActionType.openLayoutMenu,
        enabled: true
      }, {
        name: 'Clear Trace',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          this.tracingService.clearTrace();
          this.updateProperties();
          this.callChangeFunction();
        }
      }, {
        name: 'Clear Outbreak Stations',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          this.tracingService.clearOutbreakStations();
          this.setNodeSize(this.nodeSize);
          this.callChangeFunction();
        }
      }, {
        name: 'Clear Invisibility',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          this.tracingService.clearInvisibility();
          this.updateAll();
          this.callChangeFunction();
        }
      }
    ];
  }

  private createStationActions(node): MenuAction[] {
    let selectedNodes = null;
    let multipleStationsSelected = false;
    let allOutbreakStations = false;
    let allMetaStations = false;
    let allNonMetaStations = false;

    if (this.cy != null && node != null) {
      selectedNodes = this.cy.nodes(':selected');
      multipleStationsSelected = node.selected() && selectedNodes.size() > 1;
      allOutbreakStations = multipleStationsSelected ? selectedNodes.allAre('[?outbreak]') : node.data('outbreak');
      allMetaStations = multipleStationsSelected ? selectedNodes.allAre('[?contains]') : node.data('contains');
      allNonMetaStations = multipleStationsSelected ? !selectedNodes.is('[?contains]') : !node.data('contains');
    }

    return [
      {
        name: 'Show Properties',
        type: MenuActionType.runAction,
        enabled: !multipleStationsSelected,
        action: () => {
          const station = this.tracingService.getStationsById([node.id()])[0];
          const connected = this.tracingService.getDeliveriesById(Array.from(new Set(station.incoming.concat(station.outgoing)).values()));
          const dialogData: StationPropertiesData = {
            station: station,
            connectedDeliveries: connected
          };

          this.dialogService.open(StationPropertiesComponent, {data: dialogData}).afterClosed().subscribe(connections => {
            if (connections) {
              this.tracingService.setConnectionsOfStation(node.id(), connections);
              this.updateProperties();
            }
          });
        }
      }, {
        name: 'Show Forward Trace',
        type: MenuActionType.runAction,
        enabled: !multipleStationsSelected,
        action: () => {
          this.tracingService.showStationForwardTrace(node.id());
          this.updateProperties();
          this.callChangeFunction();
        }
      }, {
        name: 'Show Backward Trace',
        type: MenuActionType.runAction,
        enabled: !multipleStationsSelected,
        action: () => {
          this.tracingService.showStationBackwardTrace(node.id());
          this.updateProperties();
          this.callChangeFunction();
        }
      }, {
        name: 'Show Whole Trace',
        type: MenuActionType.runAction,
        enabled: !multipleStationsSelected,
        action: () => {
          this.tracingService.showStationTrace(node.id());
          this.updateProperties();
          this.callChangeFunction();
        }
      }, {
        name: allOutbreakStations ? 'Unmark as Outbreak' : 'Mark as Outbreak',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          this.tracingService
            .markStationsAsOutbreak(multipleStationsSelected ? selectedNodes.map(s => s.id()) : [node.id()], !allOutbreakStations);
          this.setNodeSize(this.nodeSize);
          this.callChangeFunction();
        }
      }, {
        name: 'Make Invisible',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          this.tracingService.makeStationsInvisible(multipleStationsSelected ? selectedNodes.map(s => s.id()) : [node.id()]);
          this.updateAll();
          this.callChangeFunction();
        }
      }, {
        name: 'Merge Stations',
        type: MenuActionType.runAction,
        enabled: multipleStationsSelected,
        action: () => {
          if (allNonMetaStations) {
            const dialogData: DialogPromptData = {
              title: 'Input',
              message: 'Please specify name of meta station:',
              placeholder: 'Name'
            };

            this.dialogService.open(DialogPromptComponent, {data: dialogData}).afterClosed().subscribe(name => {
              if (name != null) {
                this.tracingService.mergeStations(selectedNodes.map(s => s.id()), name);
                this.updateAll();
                this.callChangeFunction();
              }
            });
          } else {
            UtilService.showErrorMessage(this.dialogService, 'Merging is only provided for non-meta stations!');
          }
        }
      }, {
        name: 'Expand',
        type: MenuActionType.runAction,
        enabled: allMetaStations,
        action: () => {
          this.tracingService.expandStations(multipleStationsSelected ? selectedNodes.map(s => s.id()) : node.id());
          this.updateAll();
          this.callChangeFunction();
        }
      }
    ];
  }

  private createDeliveryActions(edge): MenuAction[] {
    return [
      {
        name: 'Show Properties',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          if (this.mergeMap.has(edge.id())) {
            UtilService.showErrorMessage(this.dialogService, 'Showing Properties of merged delivery is not supported!');
          } else {
            const dialogData: DeliveryPropertiesData = {
              delivery: this.tracingService.getDeliveriesById([edge.id()])[0]
            };

            this.dialogService.open(DeliveryPropertiesComponent, {data: dialogData});
          }
        }
      }, {
        name: 'Show Forward Trace',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          if (this.mergeMap.has(edge.id())) {
            UtilService.showErrorMessage(this.dialogService, 'Showing Trace of merged delivery is not supported!');
          } else {
            this.tracingService.showDeliveryForwardTrace(edge.id());
            this.updateProperties();
            this.callChangeFunction();
          }
        }
      }, {
        name: 'Show Backward Trace',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          if (this.mergeMap.has(edge.id())) {
            UtilService.showErrorMessage(this.dialogService, 'Showing Trace of merged delivery is not supported!');
          } else {
            this.tracingService.showDeliveryBackwardTrace(edge.id());
            this.updateProperties();
            this.callChangeFunction();
          }
        }
      }, {
        name: 'Show Whole Trace',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          if (this.mergeMap.has(edge.id())) {
            UtilService.showErrorMessage(this.dialogService, 'Showing Trace of merged delivery is not supported!');
          } else {
            this.tracingService.showDeliveryTrace(edge.id());
            this.updateProperties();
            this.callChangeFunction();
          }
        }
      }
    ];
  }

  private createLayoutActions(): MenuAction[] {
    return [
      {
        name: 'Fruchterman-Reingold',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => this.cy.layout({name: 'fruchterman'})
      }, {
        name: 'Constraint-Based',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          let layout;
          const layoutDialogData: DialogActionsData = {
            title: 'Layout running',
            actions: [{name: 'Stop', action: () => layout.stop()}]
          };
          const layoutDialog = this.dialogService.open(DialogActionsComponent, {
            disableClose: true,
            data: layoutDialogData
          });

          layout = this.cy.elements().makeLayout({
            name: 'cola',
            ungrabifyWhileSimulating: true,
            avoidOverlap: false,
            animate: true,
            maxSimulationTime: 60000,
            stop: function () {
              layoutDialog.close();
            }
          });
          layout.run();
        }
      }, {
        name: 'Random',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => this.cy.layout({name: 'random'})
      }, {
        name: 'Grid',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => this.cy.layout({name: 'grid'})
      }, {
        name: 'Circle',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => this.cy.layout({name: 'circle'})
      }, {
        name: 'Concentric',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => this.cy.layout({name: 'concentric'})
      }, {
        name: 'Breadth-first',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => this.cy.layout({name: 'breadthfirst'})
      }, {
        name: 'Spread',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => this.cy.layout({name: 'spread'})
      }, {
        name: 'Directed acyclic graph',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => this.cy.layout({name: 'dagre'})
      }
    ];
  }

  private callChangeFunction() {
    if (this.changeFunction != null) {
      this.changeFunction();
    }
  }

}
