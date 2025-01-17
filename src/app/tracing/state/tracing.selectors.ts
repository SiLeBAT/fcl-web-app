import { createFeatureSelector, createSelector } from "@ngrx/store";
import { STATE_SLICE_NAME } from "./tracing.reducers";
import { TracingState } from "../state.model";
import {
    DeliveriesTabId,
    FilterTabId,
    HighlightingTabId,
    StationsTabId,
} from "../configuration/configuration.constants";
import { ActivityState } from "../configuration/configuration.model";

// SELECTORS
export const selectTracingFeatureState =
    createFeatureSelector<TracingState>(STATE_SLICE_NAME);

export const getFclData = createSelector(
    selectTracingFeatureState,
    (state) => state.fclData,
);

export const getLastUnchangedJsonDataExtract = createSelector(
    selectTracingFeatureState,
    (state) => state.lastUnchangedJsonDataExtract,
);

export const getTracingActive = createSelector(
    selectTracingFeatureState,
    (state) => state.tracingActive,
);

export const selectIsModelLoaded = createSelector(
    selectTracingFeatureState,
    (state) => state.isModelLoaded,
);

export const selectIsModelLoading = createSelector(
    selectTracingFeatureState,
    (state) => state.isModelLoading,
);

export const getVisioReport = createSelector(
    selectTracingFeatureState,
    (state) => state.visioReport,
);

export const getROASettings = createSelector(
    selectTracingFeatureState,
    (state) => state.roaSettings,
);

export const getGraphSettings = createSelector(
    getFclData,
    (fclData) => fclData.graphSettings,
);

export const getShowZoom = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.showZoom,
);

export const getShowLegend = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.showLegend,
);

export const getMergeDeliveriesType = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.mergeDeliveriesType,
);

export const getInt2ExtPropMaps = createSelector(
    getFclData,
    (fclData) => fclData.source.int2ExtPropMaps,
);

export const getFclElements = createSelector(
    getFclData,
    (fclData) => fclData.fclElements,
);

export const getGroupSettings = createSelector(
    getFclData,
    (fclData) => fclData.groupSettings,
);

export const getTracingSettings = createSelector(
    getFclData,
    (fclData) => fclData.tracingSettings,
);

export const selectHighlightingSettings = createSelector(
    getFclData,
    (fclData) => fclData.graphSettings.highlightingSettings,
);

export const getSelectedElements = createSelector(
    getFclData,
    (fclData) => fclData.graphSettings.selectedElements,
);

export const selectSourceFileName = createSelector(
    getFclData,
    (fclData) => fclData?.source?.name ?? null,
);

export const getMakeElementsInvisibleInputState = createSelector(
    selectHighlightingSettings,
    getSelectedElements,
    getTracingSettings,
    (highlightingSettings, selectedElements, tracingSettings) => ({
        highlightingSettings: highlightingSettings,
        selectedElements: selectedElements,
        tracingSettings: tracingSettings,
    }),
);

export const selectStationHighlightingSettings = createSelector(
    selectHighlightingSettings,
    (highlightingSettings) => highlightingSettings.stations,
);

export const getNodeSize = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.nodeSize,
);

export const getAdjustEdgeWidthToNodeSize = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.adjustEdgeWidthToNodeSize,
);

export const getEdgeWidth = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.edgeWidth,
);

export const getFontSize = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.fontSize,
);

export const selectGraphType = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.type,
);

export const selectShowConfigurationSideBar = createSelector(
    selectTracingFeatureState,
    (state) => state.showConfigurationSideBar,
);

export const getFitGraphToVisibleArea = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.fitGraphToVisibleArea,
);

export const selectDataServiceInputState = createSelector(
    getInt2ExtPropMaps,
    getFclElements,
    getGroupSettings,
    getTracingSettings,
    selectHighlightingSettings,
    getSelectedElements,
    (
        int2ExtPropMaps,
        fclElements,
        groupSettings,
        tracingSettings,
        highlightingSettings,
        selectedElements,
    ) => ({
        int2ExtPropMaps: int2ExtPropMaps,
        fclElements: fclElements,
        groupSettings: groupSettings,
        tracingSettings: tracingSettings,
        highlightingSettings: highlightingSettings,
        selectedElements: selectedElements,
    }),
);

export const selectSharedGraphState = createSelector(
    selectDataServiceInputState,
    getGraphSettings,
    (basicGraphData, graphSettings) => ({
        ...basicGraphData,
        selectedElements: graphSettings.selectedElements,
        mergeDeliveriesType: graphSettings.mergeDeliveriesType,
        showMergedDeliveriesCounts: graphSettings.showMergedDeliveriesCounts,
        fontSize: graphSettings.fontSize,
        nodeSize: graphSettings.nodeSize,
        ghostStation: graphSettings.ghostStation,
        ghostDelivery: graphSettings.ghostDelivery,
        hoverDeliveries: graphSettings.hoverDeliveries,
    }),
);

const selectSchemaGraphPositions = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.stationPositions,
);

const selectSchemaGraphLayout = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.schemaLayout,
);

export const selectSchemaGraphState = createSelector(
    selectSharedGraphState,
    selectSchemaGraphPositions,
    selectSchemaGraphLayout,
    (sharedGraphState, positions, layout) => ({
        ...sharedGraphState,
        stationPositions: positions,
        layout: layout,
    }),
);

export const getROAReportData = createSelector(
    getFclElements,
    selectSchemaGraphState,
    getROASettings,
    (fclElements, schemaGraphState, roaSettings) => ({
        schemaGraphState: schemaGraphState,
        roaSettings: roaSettings,
        samples: fclElements.samples,
    }),
);

const selectGisGraphLayout = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.gisLayout,
);

const selectTileServer = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.tileServer,
);

const selectMapType = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.mapType,
);

const selectShapeFileData = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.shapeFileData,
);

export const selectGisGraphState = createSelector(
    selectSharedGraphState,
    selectGisGraphLayout,
    selectMapType,
    selectShapeFileData,
    selectTileServer,
    (sharedGraphState, layout, mapType, shapeFileData, tileServer) => ({
        ...sharedGraphState,
        layout: layout,
        mapType: mapType,
        tileServer: tileServer,
        shapeFileData: shapeFileData,
    }),
);

const selectGeojsonBorderWidth = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.geojsonBorderWidth,
);

const selectGeojsonBorderColor = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.geojsonBorderColor,
);

export const getMapConfig = createSelector(
    selectGisGraphLayout,
    selectMapType,
    selectShapeFileData,
    selectGeojsonBorderColor,
    selectGeojsonBorderWidth,
    selectTileServer,
    (
        gisLayout,
        mapType,
        shapeFileData,
        borderColor,
        borderWidth,
        tileServer,
    ) => ({
        layout: gisLayout,
        mapType: mapType,
        tileServer: tileServer,
        shapeFileData: shapeFileData,
        geojsonBorderColor: borderColor,
        geojsonBorderWidth: borderWidth,
    }),
);

export const getStyleConfig = createSelector(
    getNodeSize,
    getEdgeWidth,
    getFontSize,
    (nodeSize, edgeWidth, fontSize) => ({
        nodeSize: nodeSize,
        edgeWidth: edgeWidth,
        fontSize: fontSize,
    }),
);

export const getSchemaGraphLayout = createSelector(
    getGraphSettings,
    (graphSettings) => graphSettings.schemaLayout,
);

export const getGroupingData = createSelector(
    selectDataServiceInputState,
    selectSchemaGraphPositions,
    (dataServiceInputState, positions) => ({
        ...dataServiceInputState,
        stationPositions: positions,
    }),
);

export const getActiveConfigurationTabId = createSelector(
    selectTracingFeatureState,
    (state) => state.configurationTabIndices.activeConfigurationTabId,
);

export const getActiveFilterTabId = createSelector(
    selectTracingFeatureState,
    (state) => state.configurationTabIndices.activeFilterTabId,
);

export const getActiveHighlightingTabId = createSelector(
    selectTracingFeatureState,
    (state) => state.configurationTabIndices.activeHighlightingTabId,
);

export const selectFilterStationTabActivityState = createSelector(
    selectTracingFeatureState,
    (state) =>
        state.showConfigurationSideBar &&
        state.configurationTabIndices.activeFilterTabId === StationsTabId &&
        state.configurationTabIndices.activeConfigurationTabId === FilterTabId
            ? state.animatingTabCount === 0 && !state.isConfSideBarOpening
                ? ActivityState.OPEN
                : ActivityState.OPENING
            : ActivityState.INACTIVE,
);

export const selectFilterDeliveryTabActivityState = createSelector(
    selectTracingFeatureState,
    (state) =>
        state.showConfigurationSideBar &&
        state.configurationTabIndices.activeFilterTabId === DeliveriesTabId &&
        state.configurationTabIndices.activeConfigurationTabId === FilterTabId
            ? state.animatingTabCount === 0 && !state.isConfSideBarOpening
                ? ActivityState.OPEN
                : ActivityState.OPENING
            : ActivityState.INACTIVE,
);

export const selectIsHighlightingStationTabActive = createSelector(
    selectTracingFeatureState,
    (state) =>
        state.showConfigurationSideBar &&
        state.configurationTabIndices.activeHighlightingTabId ===
            StationsTabId &&
        state.configurationTabIndices.activeConfigurationTabId ===
            HighlightingTabId,
);

export const selectIsHighlightingDeliveryTabActive = createSelector(
    selectTracingFeatureState,
    (state) =>
        state.showConfigurationSideBar &&
        state.configurationTabIndices.activeHighlightingTabId ===
            DeliveriesTabId &&
        state.configurationTabIndices.activeConfigurationTabId ===
            HighlightingTabId,
);

const selectFilterSettings = createSelector(
    selectTracingFeatureState,
    (state) => state.filterSettings,
);

const selectStationFilterSettings = createSelector(
    selectFilterSettings,
    (filterSettings) => filterSettings.stationFilter,
);

export const selectStationFilterState = createSelector(
    selectFilterStationTabActivityState,
    selectDataServiceInputState,
    selectStationFilterSettings,
    (activityState, dataServiceInputState, stationFilterSettings) => ({
        activityState: activityState,
        dataServiceInputState: dataServiceInputState,
        filterTableState: stationFilterSettings,
    }),
);

export const getHighlightingConfigurationSettings = createSelector(
    selectTracingFeatureState,
    (state) => state.highlightingConfigurationSettings,
);

const selectDeliveryHighlightingConfigurationSettings = createSelector(
    getHighlightingConfigurationSettings,
    (state) => state.deliveryEditRules,
);

export const selectStationHighlightingState = createSelector(
    selectDataServiceInputState,
    selectStationHighlightingSettings,
    getHighlightingConfigurationSettings,
    (
        dataServiceInputState,
        stationHighlightingSettings,
        highlightingConfigs,
    ) => ({
        dataServiceInputState: dataServiceInputState,
        highlightingState: stationHighlightingSettings,
        editRules: highlightingConfigs.stationEditRules,
    }),
);

export const selectDeliveryHighlightingState = createSelector(
    selectDataServiceInputState,
    selectDeliveryHighlightingConfigurationSettings,
    (dataServiceInputState, editRules) => ({
        dataServiceInputState: dataServiceInputState,
        editRules: editRules,
    }),
);

const selectDeliveryFilterSettings = createSelector(
    selectFilterSettings,
    (filterSettings) => filterSettings.deliveryFilter,
);

export const selectDeliveryFilterState = createSelector(
    selectFilterDeliveryTabActivityState,
    selectDataServiceInputState,
    selectDeliveryFilterSettings,
    (activityState, dataServiceInputState, deliveryFilterSettings) => ({
        activityState: activityState,
        dataServiceInputState: dataServiceInputState,
        filterTableState: deliveryFilterSettings,
    }),
);

export const selectImportWarnings = createSelector(
    getFclData,
    (fclData) => fclData.importWarnings,
);

export const selectImportHasWarnings = createSelector(
    selectImportWarnings,
    (importWarnings) => importWarnings.length > 0,
);
