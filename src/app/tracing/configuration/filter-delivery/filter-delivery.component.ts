import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as tracingActions from '../../state/tracing.actions';
import { TableRow, BasicGraphState, DataTable, DataServiceData } from '@app/tracing/data.model';
import { takeWhile } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { TableService } from '@app/tracing/services/table.service';
import { AlertService } from '@app/shared/services/alert.service';
import { DataService } from '@app/tracing/services/data.service';
import { InputData as FilterElementsViewInputData } from '../filter-elements-view/filter-elements-view.component';
import { FilterTableSettings } from '../configuration.model';
import { TableType } from '../model';
import { SelectFilterTableColumnsMSA } from '../configuration.actions';

interface FilterTableState {
    graphState: BasicGraphState;
    filterTableState: FilterTableSettings;
}

interface CachedData {
    dataTable: DataTable;
    data: DataServiceData;
}

@Component({
    selector: 'fcl-filter-delivery',
    templateUrl: './filter-delivery.component.html',
    styleUrls: ['./filter-delivery.component.scss']
})
export class FilterDeliveryComponent implements OnInit, OnDestroy {

    private isFilterDeliveryTabActive$: Observable<boolean> = this.store.pipe(
        select(tracingSelectors.getIsFilterDeliveryTabActive),
        takeWhile(() => this.componentIsActive)
    );

    private componentIsActive = true;
    private stateSubscription: Subscription;

    private cachedData: CachedData;
    private cachedState: FilterTableState;

    private filterElementsViewInputData_: FilterElementsViewInputData;

    get filterElementsViewInputData(): FilterElementsViewInputData {
        return this.filterElementsViewInputData_;
    }

    constructor(
        private tableService: TableService,
        private dataService: DataService,
        private store: Store<fromTracing.State>,
        private alertService: AlertService
    ) { }

    ngOnInit(): void {
        this.isFilterDeliveryTabActive$.subscribe(
            isActive => {
                if (!isActive) {
                    if (this.stateSubscription) {
                        this.stateSubscription.unsubscribe();
                        this.stateSubscription = null;
                    }
                } else {
                    if (!this.stateSubscription) {
                        this.stateSubscription = this.store.select(tracingSelectors.getDeliveryFilterData).subscribe(
                            (state) => this.applyState(state),
                            err => this.alertService.error(`getDeliveryFilterData store subscription failed: ${err}`)
                        );
                    }
                }
            },
            err => this.alertService.error(`showConfigurationSideBar store subscription failed: ${err}`)
        );
    }

    onSelectTableColumns(): void {
        this.store.dispatch(
            new SelectFilterTableColumnsMSA({
                type: TableType.DELIVERIES,
                columns: this.tableService.getDeliveryColumns(this.cachedData.data),
                columnOrder: this.cachedState.filterTableState.columnOrder
            })
        );
    }

    onFilterSettingsChange(settings: FilterTableSettings): void {
        this.store.dispatch(new tracingActions.SetDeliveryFilterSOA({ settings: settings }));
    }

    onClearAllFilters(): void {
        this.store.dispatch(new tracingActions.ResetAllDeliveryFiltersSOA());
    }

    onMouseOverTableRow(row: TableRow): void {
    }

    onMouseLeaveTableRow(row: TableRow): void {
    }

    ngOnDestroy() {
        this.componentIsActive = false;
        if (this.stateSubscription) {
            this.stateSubscription.unsubscribe();
            this.stateSubscription = null;
        }
    }

    private applyState(state: FilterTableState) {
        let dataTable: DataTable = this.cachedData ? this.cachedData.dataTable : undefined;
        const data = this.dataService.getData(state.graphState);
        if (!this.cachedState || this.cachedState.graphState.fclElements !== state.graphState.fclElements) {
            dataTable = this.tableService.getDeliveryData(state.graphState);
        } else if (
            data.stations !== this.cachedData.data.stations ||
            data.deliveries !== this.cachedData.data.deliveries ||
            data.tracingResult !== this.cachedData.data.tracingResult ||
            data.statSel !== this.cachedData.data.statSel ||
            data.delSel !== this.cachedData.data.delSel
            ) {
            dataTable = {
                ...this.tableService.getDeliveryData(state.graphState),
                columns: this.cachedData.dataTable.columns
            };
        }

        this.cachedState = {
            ...state
        };
        this.cachedData = {
            dataTable: dataTable,
            data: data
        };
        this.updateFilterElementsViewInputData();

    }

    private updateFilterElementsViewInputData(): void {
        if (
            !this.filterElementsViewInputData_ ||
            this.cachedData.dataTable !== this.filterElementsViewInputData_.dataTable ||
            this.cachedState.filterTableState !== this.filterElementsViewInputData_.filterTableSettings
        ) {
            this.filterElementsViewInputData_ = {
                dataTable: this.cachedData.dataTable,
                filterTableSettings: this.cachedState.filterTableState
            };
        }
    }
}