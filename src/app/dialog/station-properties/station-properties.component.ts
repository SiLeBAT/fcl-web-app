import {Component, Inject, OnInit} from '@angular/core';
import {MD_DIALOG_DATA, MdDialogRef} from '@angular/material';
import {D3Service, D3, Selection} from 'd3-ng2-service';

import {Connection, DeliveryData, StationData} from '../../util/datatypes';
import {DataService} from '../../util/data.service';

export interface StationPropertiesData {
  station: StationData;
  connectedDeliveries: DeliveryData[];
}

enum NodeType {IN, OUT}

interface NodeDatum {
  id: string;
  type: NodeType;
  title: string;
  x: number;
  y: number;
}

interface EdgeDatum {
  source: NodeDatum;
  target: NodeDatum;
}

const NODE = 'node';
const HOVER = 'hover';
const EDGE = 'edge';
const HIDDEN = 'hidden';

const SVG_WIDTH = 400;
const NODE_PADDING = 15;
const NODE_WIDTH = 100;
const NODE_HEIGHT = 30;

@Component({
  templateUrl: './station-properties.component.html',
  styleUrls: ['./station-properties.component.css']
})
export class StationPropertiesComponent implements OnInit {

  properties: { name: string, value: string }[];

  private d3: D3;

  private nodeData: NodeDatum[];
  private edgeData: EdgeDatum[];
  private height: number;

  private nodesG: Selection<SVGElement, any, any, any>;
  private edgesG: Selection<SVGElement, any, any, any>;
  private dragLine: Selection<SVGElement, any, any, any>;

  constructor(public dialogRef: MdDialogRef<StationPropertiesComponent>, @Inject(MD_DIALOG_DATA) public data: StationPropertiesData,
              d3Service: D3Service) {
    this.properties = Object.keys(data.station)
      .filter(key => DataService.PROPERTIES.has(key) && key !== 'incoming' && key !== 'outgoing')
      .map(key => {
        return {
          name: DataService.PROPERTIES.get(key).name,
          value: String(data.station[key])
        };
      }).concat(data.station.properties);
    this.d3 = d3Service.getD3();

    if (data.station.incoming.length > 0 && data.station.outgoing.length > 0) {
      const nodeMap: Map<string, NodeDatum> = new Map();
      let yIn = NODE_PADDING + NODE_HEIGHT / 2;
      let yOut = NODE_PADDING + NODE_HEIGHT / 2;

      for (const id of data.station.incoming) {
        const delivery = data.connectedDeliveries.find(d => d.id === id);

        nodeMap.set(id, {
          id: id,
          type: NodeType.IN,
          title: delivery.id,
          x: NODE_WIDTH / 2 + 1,
          y: yIn
        });
        yIn += NODE_HEIGHT + NODE_PADDING;
      }

      for (const id of data.station.outgoing) {
        const delivery = data.connectedDeliveries.find(d => d.id === id);

        nodeMap.set(id, {
          id: id,
          type: NodeType.OUT,
          title: delivery.id,
          x: SVG_WIDTH - NODE_WIDTH / 2 - 1,
          y: yOut
        });
        yOut += NODE_HEIGHT + NODE_PADDING;
      }

      this.edgeData = [];

      for (const c of data.station.connections) {
        this.edgeData.push({
          source: nodeMap.get(c.source),
          target: nodeMap.get(c.target)
        });
      }

      this.nodeData = Array.from(nodeMap.values());
      this.height = Math.max(yIn, yOut) - NODE_HEIGHT / 2;
    }
  }

  //noinspection JSUnusedGlobalSymbols
  close() {
    const connections: Connection[] = this.edgeData.map(edge => {
      return {
        source: edge.source.id,
        target: edge.target.id
      };
    });

    this.dialogRef.close(connections);
  }

  ngOnInit() {
    if (this.height != null) {
      const svg: Selection<SVGElement, any, any, any> = this.d3
        .select('#in-out-connector').append<SVGElement>('svg')
        .attr('width', SVG_WIDTH).attr('height', this.height)
        .on('mouseup', () => this.dragLine.classed(HIDDEN, true));

      const defs = svg.append<SVGElement>('defs');

      defs.append('marker')
        .attr('id', 'end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 7)
        .attr('markerWidth', 3.5)
        .attr('markerHeight', 3.5)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5');

      const g = svg.append<SVGElement>('g');

      this.dragLine = g.append<SVGElement>('path').attr('class', EDGE + ' ' + HIDDEN).attr('marker-end', 'url(#end-arrow)');
      this.edgesG = g.append<SVGElement>('g');
      this.nodesG = g.append<SVGElement>('g');

      this.addNodes();
      this.updateEdges();
    }
  }

  private addNodes() {
    const d3 = this.d3;
    let hoverD: NodeDatum;

    const nodes = this.nodesG.selectAll<SVGElement, NodeDatum>('g').data(this.nodeData, d => d.id).enter().append<SVGElement>('g')
      .classed(NODE, true).attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');

    nodes.append('rect').attr('x', -NODE_WIDTH / 2).attr('y', -NODE_HEIGHT / 2).attr('width', NODE_WIDTH).attr('height', NODE_HEIGHT);
    nodes.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').text(d => d.title);

    nodes.on('mouseover', function (d) {
      hoverD = d;
      d3.select(this).classed(HOVER, true);
    }).on('mouseout', function () {
      hoverD = null;
      d3.select(this).classed(HOVER, false);
    });

    nodes.filter(d => d.type === NodeType.IN).call(this.d3.drag<SVGElement, NodeDatum>()
      .on('start drag', d => {
        const mousePos = d3.mouse(document.getElementById('in-out-connector'));

        this.dragLine.attr('d', 'M' + (d.x + NODE_WIDTH / 2) + ',' + d.y + 'L' + mousePos[0] + ',' + mousePos[1]);
        this.dragLine.classed(HIDDEN, false);
      })
      .on('end', d => {
        if (hoverD != null && hoverD.type === NodeType.OUT) {
          const newEdge: EdgeDatum = {
            source: d,
            target: hoverD
          };

          if (this.edgeData.find(e => e.source === newEdge.source && e.target === newEdge.target) == null) {
            this.edgeData.push(newEdge);
            this.updateEdges();
          }
        }

        this.dragLine.classed(HIDDEN, true);
      }));
  }

  private updateEdges() {
    const edges = this.edgesG.selectAll<SVGElement, EdgeDatum>('path').data(this.edgeData, d => d.source.id + '->' + d.target.id);

    edges.enter().append('path').classed(EDGE, true)
      .attr('d', d => 'M' + (d.source.x + NODE_WIDTH / 2) + ',' + d.source.y + 'L' + (d.target.x - NODE_WIDTH / 2) + ',' + d.target.y)
      .on('click', d => {
        this.edgeData.splice(this.edgeData.indexOf(d), 1);
        this.updateEdges();
      });
    edges.exit().remove();
  }
}
