import { JsonData } from "./io/ext-data-model.v1";

export type HighlightingRuleId = string;
export type JsonDataExtract = Pick<JsonData, "settings" | "tracing">;

interface ViewData {
    selected: boolean;
    invisible: boolean;
    expInvisible: boolean;
}

export interface PropMap {
    [key: string]: string;
}

export interface FclDataSourceInfo {
    name?: string;
    data?: any;
    int2ExtPropMaps: PropMaps;
}

export interface FclData {
    source: FclDataSourceInfo;
    importWarnings: string[];
    fclElements: FclElements;
    graphSettings: GraphSettings;
    tracingSettings: TracingSettings;
    groupSettings: GroupData[];
}

export interface StandardFilterSettings {
    filterTerm: string;
}

export interface TableColumn {
    id: string;
    name: string;
    dataIsUnavailable?: boolean;
}

export type Property = TableColumn;

export interface RowHighlightingInfo {
    color: Color[];
    shape?: NodeShapeType | null;
}

export type TreeStatus = "collapsed" | "expanded";

export interface TableRow {
    id: string;
    highlightingInfo: RowHighlightingInfo;
    parentRow?: TableRow;
    parentRowId?: string;
    treeStatus?: TreeStatus;
    [key: string]:
        | string
        | number
        | boolean
        | RowHighlightingInfo
        | TableRow
        | undefined;
}

export interface ColumnSets {
    columns: TableColumn[];
    favouriteColumns: TableColumn[];
    otherColumns: TableColumn[];
}

export interface DataTable extends ColumnSets {
    modelFlag: Record<string, never>;
    rows: TableRow[];
}

export interface FclElements {
    stations: StationStoreData[];
    deliveries: DeliveryStoreData[];
    samples: SampleData[];
}

export type StationId = string;
export type DeliveryId = string;

export interface PropertyEntry {
    name: string;
    value: number | boolean | string;
}

export interface StationStoreData {
    id: StationId;
    name?: string;
    lat?: number;
    lon?: number;
    incoming: string[];
    outgoing: string[];
    connections: Connection[];
    properties: PropertyEntry[];
}

export interface DeliveryStoreData {
    id: DeliveryId;
    name?: string;
    lot?: string;
    lotKey?: string;
    dateIn?: string;
    dateOut?: string;
    source: string;
    target: string;
    properties: PropertyEntry[];
}

export interface Layout {
    zoom: number;
    pan: Position;
}

export interface Color {
    r: number;
    g: number;
    b: number;
}

export interface Position {
    x: number;
    y: number;
}

export type PositionMap = Record<string, Position>;

export interface Connection {
    source: DeliveryId;
    target: DeliveryId;
}

export enum SampleResultType {
    Confirmed,
    Negative,
    Probable,
    Unknown,
}

export interface SampleData {
    station: string;
    lot?: string;
    type?: string;
    material?: string;
    time?: string;
    amount?: string;
    result?: string;
    resultType: SampleResultType;
}

export interface SelectedElements {
    stations: StationId[];
    deliveries: DeliveryId[];
}

export interface FoodChainElementTypeSelection {
    stations: boolean;
    deliveries: boolean;
}

export interface SetOutbreaksOptions {
    stationIds?: string[];
    deliveryIds?: string[];
    outbreak: boolean;
}

export interface SetKillContaminationOptions {
    stationIds?: string[];
    deliveryIds?: string[];
    killContamination: boolean;
}

export interface ShowElementsTraceParams {
    stationIds: StationId[];
    deliveryIds: DeliveryId[];
    observedType: ObservedType;
}

export interface GraphSettings extends MapSettings, ShapeFileSettings {
    type: GraphType;
    nodeSize: number;
    adjustEdgeWidthToNodeSize: boolean;
    edgeWidth: number;
    fontSize: number;
    mergeDeliveriesType: MergeDeliveriesType;
    showMergedDeliveriesCounts: boolean;
    showLegend: boolean;
    showZoom: boolean;
    fitGraphToVisibleArea: boolean;
    skipUnconnectedStations: boolean;
    selectedElements: SelectedElements;
    stationPositions: { [key: string]: Position };
    highlightingSettings: HighlightingSettings;
    schemaLayout: Layout | null;
    gisLayout: Layout | null;
    ghostStation: StationId | null;
    ghostDelivery: DeliveryId | null;
    hoverDeliveries: DeliveryId[];
}
export interface ShapeStyleSettings {
    geojsonBorderWidth: number;
    geojsonBorderColor: Color;
}
export interface ShapeFileSettings extends ShapeStyleSettings {
    shapeFileData: ShapeFileData | null;
}

export interface MapSettings {
    tileServer: TileServer;
    mapType: MapType;
}

export interface MapViewConfig extends MapSettings, ShapeFileSettings {
    layout: Layout | null;
}

export interface HighlightingSettings {
    invisibleStations: StationId[];
    invisibleDeliveries: DeliveryId[];
    stations: StationHighlightingRule[];
    deliveries: DeliveryHighlightingRule[];
}

export interface MakeElementsInvisibleInputState {
    highlightingSettings: HighlightingSettings;
    tracingSettings: TracingSettings;
}

export interface LabelPart {
    property?: string | null;
    prefix: string;
    useIndex?: boolean;
}

export interface HighlightingRule {
    id: HighlightingRuleId;
    name: string;
    showInLegend: boolean;
    color: Color | null;
    invisible: boolean;
    userDisabled: boolean;
    autoDisabled: boolean;
    adjustThickness: boolean;
    labelProperty: string | null;
    labelPrefix?: string;
    labelParts?: LabelPart[];
    valueCondition: ValueCondition | null;
    logicalConditions: LogicalCondition[][] | null;
}

export interface DeliveryHighlightingRule extends HighlightingRule {
    linePattern: LinePatternType | null;
}

export interface StationHighlightingRule extends HighlightingRule {
    shape: NodeShapeType | null;
}

export enum NodeShapeType {
    CIRCLE = "ellipse",
    SQUARE = "rectangle",
    TRIANGLE = "triangle",
    PENTAGON = "pentagon",
    HEXAGON = "hexagon",
    OCTAGON = "octagon",
    STAR = "star",
    DIAMOND = "diamond",
}

export enum MergeDeliveriesType {
    MERGE_ALL,
    MERGE_LOT_WISE,
    MERGE_PRODUCT_WISE,
    MERGE_LABEL_WISE,
    NO_MERGE,
}

export interface LogicalCondition {
    propertyName: string;
    operationType: OperationType;
    value: string;
}

export enum OperationType {
    EQUAL = "==",
    CONTAINS = "contains",
    GREATER = ">",
    NOT_EQUAL = "!=",
    LESS = "<",
    REGEX_EQUAL = "== (Regex)",
    REGEX_NOT_EQUAL = "!= (Regex)",
    REGEX_EQUAL_IGNORE_CASE = "== (Regex Ignore Case)",
    REGEX_NOT_EQUAL_IGNORE_CASE = "!= (Regex Ignore Case)",
}

export interface ValueCondition {
    propertyName: string;
    valueType: ValueType;
    useZeroAsMinimum: boolean;
}

export enum ValueType {
    VALUE = "Value",
    LOG_VALUE = "Log Value",
}

export interface ElementTracingSettings {
    id: StationId | DeliveryId;
    observed: ObservedType;
    crossContamination: boolean;
    killContamination: boolean;
    weight: number;
    outbreak: boolean;
}

export type StationTracingSettings = ElementTracingSettings;
export type DeliveryTracingSettings = ElementTracingSettings;

export enum CrossContTraceType {
    USE_EXPLICIT_DELIVERY_DATES,
    USE_INFERED_DELIVERY_DATES_LIMITS,
    DO_NOT_CONSIDER_DELIVERY_DATES,
}

export interface GlobalTracingSettings {
    crossContTraceType: CrossContTraceType;
}

export interface TracingSettings extends GlobalTracingSettings {
    stations: StationTracingSettings[];
    deliveries: DeliveryTracingSettings[];
}

export interface GroupData {
    id: StationId;
    name?: string;
    contains: string[];
    groupType?: GroupType;
}

export enum GraphType {
    GRAPH = "Graph" as any,
    GIS = "GIS" as any,
}

export enum TileServer {
    MAPNIK = "MAPNIK",
    // the Black & White Map might be deactivatd only temporarily
    //BLACK_AND_WHITE = "BLACK_AND_WHITE",
}

export enum MapType { // please note: the order of the keys is relevant for presentation
    TILES_ONLY = "TILES_ONLY",
    SHAPE_ONLY = "SHAPE_ONLY",
    TILES_AND_SHAPE = "TILES_AND_SHAPE",
}

export interface AvailableMaps {
    tiles: Array<TileServer>;
    types: Array<MapType>;
    mapTypeLabels: Record<MapType, string>;
    tileServerLabels: Record<TileServer, string>;
}

export enum GroupMode {
    WEIGHT_ONLY = "Weight only" as any,
    PRODUCT_AND_WEIGHT = "Product name and weight" as any,
    LOT_AND_WEIGHT = "Lot and weight" as any,
}

export enum GroupType {
    SOURCE_GROUP = "Source group" as any,
    TARGET_GROUP = "Target group" as any,
    ISOLATED_GROUP = "Isolated subgraph" as any,
    SIMPLE_CHAIN = "Simple chain" as any,
}

export enum ObservedType {
    NONE = "none" as any,
    FULL = "full" as any,
    FORWARD = "forward" as any,
    BACKWARD = "backward" as any,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ShapeFileData {
    // todo: to define
}

export interface HighlightingStats {
    counts: Record<HighlightingRuleId, number>;
    conflicts: Record<HighlightingRuleId, number>;
}
export interface DataServiceData {
    modelFlag: Record<string, never>;
    statMap: Record<StationId, StationData>;
    stations: StationData[];
    isStationAnonymizationActive: boolean;
    delMap: Record<DeliveryId, DeliveryData>;
    deliveries: DeliveryData[];
    statSel: Record<StationId, boolean>;
    delSel: Record<DeliveryId, boolean>;
    statVis: Record<StationId, boolean>;
    delVis: Record<DeliveryId, boolean>;
    legendInfo?: LegendDisplayEntry[] | null;
    tracingPropsUpdatedFlag: Record<string, never>;
    stationAndDeliveryHighlightingUpdatedFlag: Record<string, never>;
    highlightingStats?: HighlightingStats;
    getStatById(ids: string[]): StationData[];
    getDelById(ids: string[]): DeliveryData[];
}

export interface StationTracingData extends StationTracingSettings {
    forward: boolean;
    backward: boolean;
    score: number;
    commonLink: boolean;
}

export interface DeliveryTracingData extends DeliveryTracingSettings {
    forward: boolean;
    backward: boolean;
    score: number;
}

export interface StationData
    extends StationStoreData,
        StationTracingData,
        ViewData,
        GroupData {
    anonymizedName?: string;
    isMeta: boolean;
    contained: boolean;
    highlightingInfo?: StationHighlightingInfo;
}

export interface HighlightingInfo {
    label: string;
    color: Color[];
}

export interface StationHighlightingInfo extends HighlightingInfo {
    shape: NodeShapeType | null;
    size: number;
}

export interface DeliveryHighlightingInfo extends HighlightingInfo {
    linePattern?: LinePatternType;
}

export enum LinePatternType {
    SOLID,
}

export interface DeliveryData
    extends DeliveryStoreData,
        DeliveryTracingData,
        ViewData {
    originalSource: StationId;
    originalTarget: StationId;
    highlightingInfo?: DeliveryHighlightingInfo;
}

export interface SelectedElements {
    stations: StationId[];
    deliveries: DeliveryId[];
}

export enum DialogAlignment {
    LEFT,
    CENTER,
    RIGHT,
}

export interface PropMaps {
    stations: Record<string, string>;
    deliveries: Record<string, string>;
}

export interface DataServiceInputState {
    int2ExtPropMaps: PropMaps;
    fclElements: FclElements;
    groupSettings: GroupData[];
    tracingSettings: TracingSettings;
    highlightingSettings: HighlightingSettings;
    selectedElements: SelectedElements;
}

export interface SharedGraphState extends DataServiceInputState {
    mergeDeliveriesType: MergeDeliveriesType;
    showMergedDeliveriesCounts: boolean;
    ghostStation: StationId | null;
    ghostDelivery: DeliveryId | null;
    hoverDeliveries: DeliveryId[];
}

export interface GisGraphState extends SharedGraphState {
    layout: Layout | null;
}
export interface SchemaGraphState extends SharedGraphState {
    stationPositions: Record<StationId, Position>;
    layout: Layout | null;
}

export interface SetTracingSettingsPayload {
    tracingSettings: TracingSettings;
}

export interface SetHighlightingSettingsPayload {
    highlightingSettings: HighlightingSettings;
}

export interface SetInvisibleElementsPayload {
    highlightingSettings: HighlightingSettings;
    tracingSettings: TracingSettings;
}

export interface Size {
    width: number;
    height: number;
}

export interface Range {
    min: number;
    max: number;
}

export interface LegendDisplayEntry {
    name: string;
    stationColor?: Color;
    deliveryColor?: Color;
    shape?: NodeShapeType;
}
