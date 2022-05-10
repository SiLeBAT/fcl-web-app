import { Component, Output, EventEmitter, ViewChild, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { environment } from '@env/environment';
import * as _ from 'lodash';
import { MainPageService } from '../../services/main-page.service';
import { User } from '@app/user/models/user.model';
import { GraphSettings, GraphType, MapType } from './../../../tracing/data.model';
import { Constants } from './../../../tracing/util/constants';

@Component({
    selector: 'fcl-toolbar-action',
    templateUrl: './toolbar-action.component.html',
    styleUrls: ['./toolbar-action.component.scss']
})
export class ToolbarActionComponent implements OnChanges {

    private _graphSettings: GraphSettings;

    @ViewChild('fileInput') fileInput: ElementRef;
    @Input() tracingActive: boolean;
    @Input()
    set graphSettings(value: GraphSettings) {
        this.selectedMapTypeOption = '' + value.mapType;
        this._graphSettings = value;
    }
    get graphSettings(): GraphSettings {
        return this._graphSettings;
    }

    @Input() hasGisInfo: boolean;
    @Input() availableMapTypes: MapType[];
    @Input() graphEditorActive: boolean;
    @Input() currentUser: User;
    @Input() fileName: string | null = null;
    @Output() toggleRightSidebar = new EventEmitter<boolean>();
    @Output() loadModelFile = new EventEmitter<FileList>();
    @Output() loadShapeFile = new EventEmitter<FileList>();
    @Output() loadExampleData = new EventEmitter();
    @Output() graphType = new EventEmitter<GraphType>();
    @Output() mapType = new EventEmitter<MapType>();

    graphTypes = Constants.GRAPH_TYPES;
    selectedMapTypeOption: string;
    fileNameWoExt: string | null = null;

    mapTypeToLabelMap: Map<MapType, string> = new Map([
        [MapType.MAPNIK, 'Mapnik'],
        // the following code is commented because
        // the Black & White Map might be deactivatd only temporaryly
        // [MapType.BLACK_AND_WHITE, 'Black & White'],
        [MapType.SHAPE_FILE, 'Shape File']
    ]);

    constructor(private mainPageService: MainPageService) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.fileName !== undefined) {
            this.fileNameWoExt = (
                this.fileName === null ?
                    null :
                    this.fileName.replace(/\.[^\.]+$/, '')
            );
        }
    }

    isServerLess(): boolean {
        return environment.serverless;
    }

    onSelectModelFile() {
        this.selectInputFile(
            '.json',
            (event$) => {
                const fileList: FileList = event$.target.files;
                this.loadModelFile.emit(fileList);
            }
        );
    }

    onLoadExampleData() {
        this.loadExampleData.emit();
    }

    setGraphType() {
        this.graphType.emit(this.graphSettings.type);
    }

    setMapType(mapType: MapType) {
        this.mapType.emit(mapType);
    }

    selectShapeFile(event): void {
        // this is necessary, otherwise the 'Load Shape File...' option might stay active
        setTimeout(() => { this.selectedMapTypeOption = '' + this._graphSettings.mapType; }, 0);

        this.selectInputFile(
            '.geojson',
            (event$) => {
                const fileList: FileList = event$.target.files;
                this.loadShapeFile.emit(fileList);
            }
        );
    }

    private selectInputFile(accept: string, changeHandler: (event$) => void): void {
        const nativeFileInput: HTMLInputElement = this.fileInput.nativeElement;
        nativeFileInput.value = '';
        nativeFileInput.accept = accept;
        nativeFileInput.onchange = changeHandler;
        nativeFileInput.click();
    }
}
