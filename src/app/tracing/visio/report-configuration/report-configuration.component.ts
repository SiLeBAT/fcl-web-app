import { Component, Inject, DoCheck } from "@angular/core";
import {
    MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
    MatLegacyDialogRef as MatDialogRef,
} from "@angular/material/legacy-dialog";
import { Store } from "@ngrx/store";
import * as storeActions from "../../state/tracing.actions";
import * as roaActions from "../visio.actions";
import { DataServiceInputState } from "@app/tracing/data.model";
import { take } from "rxjs/operators";
import * as TracingSelectors from "../../state/tracing.selectors";
import { State } from "@app/tracing/state/tracing.reducers";
import * as _ from "lodash";
import {
    getPublicStationProperties,
    getLotProperties,
    getSampleProperties,
    PropInfo,
} from "@app/tracing/shared/property-info";
import { DataService } from "@app/tracing/services/data.service";
import { combineLatest } from "rxjs";
import { createDefaultROASettings, getUnitPropFromAmountProp } from "../shared";
import {
    AmountUnitPair,
    LabelElementInfo,
    PropElementInfo,
    ROALabelSettings,
    ROASettings,
    TextElementInfo,
} from "../model";

function propCompare(propA: PropInfo, propB: PropInfo): number {
    const textA = propA.label ?? propA.prop;
    const textB = propB.label ?? propB.prop;
    return textA.toUpperCase().localeCompare(textB.toUpperCase());
}

function sortProps(props: PropInfo[]): PropInfo[] {
    return props.sort(propCompare);
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ReportConfigurationData {}

interface LabelInfo {
    title: string;
    disabled?: boolean;
    warning?: string;
    labelElements: LabelElementInfo[][];
    availableProps: PropInfo[];
    amountUnitPairs: AmountUnitPair[];
}

const WARNING_STATION_ANONYMIZATION_IS_ACTIVE =
    "Anonymisation Label is activated. To configure the station information shown in the ROA Style, deactivate this label in the station highlighting menu.";
const WARNING_DATA_IS_NOT_AVAILABLE = "Some data is not available.";

const AMOUNT_PROP_MATCHER_REGEXP = /.*amount$/i;

@Component({
    selector: "fcl-report-configuration",
    templateUrl: "./report-configuration.component.html",
    styleUrls: ["./report-configuration.component.scss"],
})
export class ReportConfigurationComponent implements DoCheck {
    roundNumbers: boolean = true;

    orderedLabelInfos: LabelInfo[] = [];

    private isStationAnonymizationActive = false;

    private labelInfos: { [key in keyof ROALabelSettings]: LabelInfo };
    private labelOrder: (keyof ROALabelSettings)[] = [
        "stationLabel",
        "lotLabel",
        "lotSampleLabel",
        "stationSampleLabel",
    ];

    private availableProps: {
        companyProps: PropInfo[];
        lotProps: PropInfo[];
        sampleProps: PropInfo[];
    };

    constructor(
        private store: Store<State>,
        private dataService: DataService,
        public dialogRef: MatDialogRef<ReportConfigurationComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ReportConfigurationData,
    ) {
        this.init();
    }

    ngDoCheck(): void {
        this.updateLabelInfoWarnings();
    }

    private init(): void {
        combineLatest([
            this.store.select(TracingSelectors.selectDataServiceInputState),
            this.store.select(TracingSelectors.getROASettings),
        ])
            .pipe(take(1))
            .subscribe(
                ([dataServiceInputState, roaSettings]) => {
                    this.initAvailableProps(dataServiceInputState);
                    if (roaSettings === null) {
                        this.setDefaultLabelInfos();
                    } else {
                        this.setLabelInfos(roaSettings);
                    }
                },
                (error) => {
                    throw new Error(
                        `error load roa configuration state: ${error}`,
                    );
                },
            );
    }

    private initAvailableProps(
        dataServiceInputState: DataServiceInputState,
    ): void {
        const data = this.dataService.getData(dataServiceInputState);
        this.isStationAnonymizationActive = data.isStationAnonymizationActive;

        this.availableProps = {
            companyProps: sortProps(getPublicStationProperties(data.stations)),
            lotProps: sortProps(getLotProperties(data.deliveries)),
            sampleProps: sortProps(
                getSampleProperties(dataServiceInputState.fclElements.samples),
            ),
        };
    }

    private setAmountUnitPairs(): void {
        if (this.labelInfos.lotLabel.labelElements.length >= 3) {
            const propElements =
                this.labelInfos.lotLabel.labelElements[2].filter(
                    (element) =>
                        (element as PropElementInfo).prop !== undefined,
                ) as PropElementInfo[];
            if (propElements.length >= 2) {
                this.labelInfos.lotLabel.amountUnitPairs = [
                    {
                        amount: propElements[0],
                        unit: propElements[1],
                    },
                ];
            }
        }
    }

    private setElementDependencies(): void {
        for (const labelKey of Object.keys(this.labelInfos)) {
            const labelInfo: LabelInfo = this.labelInfos[labelKey];
            labelInfo.amountUnitPairs.forEach((amountUnitPair) => {
                const depOn = amountUnitPair.amount;
                const labelElements = labelInfo.labelElements.find(
                    (elements) =>
                        elements.indexOf(amountUnitPair.amount) >= 0 &&
                        elements.indexOf(amountUnitPair.unit),
                );
                if (labelElements !== undefined) {
                    const startIndex = labelElements.indexOf(
                        amountUnitPair.amount,
                    );
                    const endIndex = labelElements.indexOf(amountUnitPair.unit);
                    for (let i = startIndex + 1; i <= endIndex; i++) {
                        labelElements[i].dependendOnProp =
                            amountUnitPair.amount.prop ?? undefined;
                    }
                }
            });
        }
    }

    private setLabelInfos(roaSettings: ROASettings): void {
        this.labelInfos = {
            stationLabel: {
                title: "Company Box Label",
                availableProps: this.availableProps.companyProps,
                labelElements: _.cloneDeep(
                    roaSettings.labelSettings.stationLabel,
                ),
                amountUnitPairs: [],
            },
            lotLabel: {
                title: "Lot Box Label",
                availableProps: this.availableProps.lotProps,
                labelElements: _.cloneDeep(roaSettings.labelSettings.lotLabel),
                amountUnitPairs: [],
            },
            lotSampleLabel: {
                title: "Lot Sample Box Label",
                availableProps: this.availableProps.sampleProps,
                labelElements: _.cloneDeep(
                    roaSettings.labelSettings.lotSampleLabel,
                ),
                amountUnitPairs: [],
            },
            stationSampleLabel: {
                title: "Station Sample Box Label",
                availableProps: this.availableProps.sampleProps,
                labelElements: _.cloneDeep(
                    roaSettings.labelSettings.stationSampleLabel,
                ),
                amountUnitPairs: [],
            },
        };
        this.orderedLabelInfos = this.labelOrder.map((l) => this.labelInfos[l]);

        // set initial labelInfo disabled and warning values
        this.orderedLabelInfos.forEach((labelInfo) => {
            labelInfo.disabled = labelInfo.availableProps.length === 0;
            labelInfo.warning =
                labelInfo.availableProps.length === 0
                    ? WARNING_DATA_IS_NOT_AVAILABLE
                    : undefined;
        });

        if (this.isStationAnonymizationActive) {
            this.labelInfos.stationLabel.disabled = true;
            this.labelInfos.stationLabel.warning =
                WARNING_STATION_ANONYMIZATION_IS_ACTIVE;
        }

        this.setAmountUnitPairs();
        this.roundNumbers = roaSettings.roundNumbers;
        this.updateLabelInfoWarnings();
    }

    private getROASettings(): ROASettings {
        const roaSettings = {
            labelSettings: {
                stationLabel: this.createLabelElementInfos(
                    this.labelInfos.stationLabel.labelElements,
                ),
                lotLabel: this.createLabelElementInfos(
                    this.labelInfos.lotLabel.labelElements,
                ),
                lotSampleLabel: this.createLabelElementInfos(
                    this.labelInfos.lotSampleLabel.labelElements,
                ),
                stationSampleLabel: this.createLabelElementInfos(
                    this.labelInfos.stationSampleLabel.labelElements,
                ),
            },
            roundNumbers: this.roundNumbers,
        };
        this.setInterpretAsNumberFlag(roaSettings);
        return roaSettings;
    }

    private setInterpretAsNumberFlag(roaSettings: ROASettings): void {
        const labelElements: LabelElementInfo[][][] = Object.values(
            roaSettings.labelSettings,
        );
        const flattenedLabelElements = _.flattenDeep(labelElements);
        const propElements = flattenedLabelElements.filter(
            (e) => (e as PropElementInfo).prop != null,
        ) as PropElementInfo[];
        for (const propElement of propElements) {
            if (propElement.prop!.match(AMOUNT_PROP_MATCHER_REGEXP)) {
                propElement.interpretAsNumber = true;
            }
        }

        const expectedAmountPropElement =
            roaSettings.labelSettings.lotSampleLabel[2].find(
                (e) => (e as PropElementInfo).prop != null,
            );
        if (expectedAmountPropElement !== undefined) {
            (expectedAmountPropElement as PropElementInfo).interpretAsNumber =
                true;
        }
    }

    private createLabelElementInfos(
        labelElements: LabelElementInfo[][],
    ): LabelElementInfo[][] {
        const result: LabelElementInfo[][] = [];
        for (const labelRow of labelElements) {
            const row: LabelElementInfo[] = [];
            for (const labelElement of labelRow) {
                if ((labelElement as PropElementInfo).prop === undefined) {
                    const textElement = labelElement as TextElementInfo;
                    row.push({
                        text: textElement.text,
                        dependendOnProp: labelElement.dependendOnProp,
                    });
                } else {
                    const propElement = labelElement as PropElementInfo;
                    row.push({
                        prop: propElement.prop,
                        altText: propElement.altText,
                        isNullable: propElement.isNullable,
                        dependendOnProp: labelElement.dependendOnProp,
                    });
                }
            }
            result.push(row);
        }
        return result;
    }

    private updateLabelInfoWarnings(): void {
        const labelInfos = Object.values(this.labelInfos);
        const enabledLabelInfos = labelInfos.filter((x) => !x.disabled);
        labelInfoLoop: for (const labelInfo of enabledLabelInfos) {
            const propSet = new Set(
                labelInfo.availableProps.map((p) => p.prop),
            );

            for (const labelElementRow of labelInfo.labelElements) {
                const propElements = labelElementRow.filter(
                    (e) => (e as PropElementInfo).prop !== undefined,
                ) as PropElementInfo[];
                const nonNullPropElements = propElements.filter(
                    (e) => e.prop !== null,
                );
                if (nonNullPropElements.some((e) => !propSet.has(e.prop!))) {
                    labelInfo.warning = WARNING_DATA_IS_NOT_AVAILABLE;
                    continue labelInfoLoop;
                }
            }

            labelInfo.warning = undefined;
        }
    }

    private setDefaultLabelInfos(): void {
        const roaSettings = createDefaultROASettings();
        this.setLabelInfos(roaSettings);
        this.initAmountUnits();
    }

    private initAmountUnits(): void {
        for (const labelKey of Object.keys(this.labelInfos)) {
            const labelInfo: LabelInfo = this.labelInfos[labelKey];
            labelInfo.amountUnitPairs.forEach((amountUnitPair) => {
                const unit = getUnitPropFromAmountProp(
                    amountUnitPair.amount.prop!,
                    labelInfo.availableProps,
                );
                amountUnitPair.unit.prop = unit;
            });
        }
    }

    onGenerateReport() {
        this.setElementDependencies();
        this.store.dispatch(
            new storeActions.SetROAReportSettingsSOA({
                roaSettings: this.getROASettings(),
            }),
        );
        this.store.dispatch(new roaActions.GenerateROAReportMSA());
        this.dialogRef.close();
    }

    onRestoreDefaults() {
        this.setDefaultLabelInfos();
    }
}
