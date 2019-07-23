import { TableComponent } from './table/table.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { MainTracingComponent } from './tracing/main-tracing/main-tracing.component';
import { SharedModule } from '../shared/shared.module';
import { TracingRoutingModule } from './tracing.routing.module';
import { GraphComponent } from './graph/graph.component';
import { GisComponent } from './gis/gis.component';
import { DialogActionsComponent } from './dialog/dialog-actions/dialog-actions.component';
import { DialogAlertComponent } from './dialog/dialog-alert/dialog-alert.component';
import { DialogPromptComponent } from './dialog/dialog-prompt/dialog-prompt.component';
import { DialogSelectComponent } from './dialog/dialog-select/dialog-select.component';
import { DialogSingleSelectComponent } from './dialog/dialog-single-select/dialog-single-select.component';
import { StationPropertiesComponent } from './dialog/station-properties/station-properties.component';
import { DeliveryPropertiesComponent } from './dialog/delivery-properties/delivery-properties.component';
import { VisioLayoutComponent } from './visio/visio-dialog/visio-dialog.component';

import { STATE_SLICE_NAME, reducer } from './state/tracing.reducers';
import { StoreModule } from '@ngrx/store';
import { GraphSettingsComponent } from './tracing/graph-settings/graph-settings.component';
import { TableSettingsComponent } from './tracing/table-settings/table-settings.component';
import { TracingEffects } from './state/tracing.effects';
import { EffectsModule } from '@ngrx/effects';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        NgxDatatableModule,
        TracingRoutingModule,
        StoreModule.forFeature(STATE_SLICE_NAME, reducer),
        EffectsModule.forFeature([TracingEffects])
    ],
    declarations: [
        MainTracingComponent,
        GraphComponent,
        GisComponent,
        TableComponent,
        DialogActionsComponent,
        DialogAlertComponent,
        DialogPromptComponent,
        DialogSelectComponent,
        DialogSingleSelectComponent,
        StationPropertiesComponent,
        DeliveryPropertiesComponent,
        VisioLayoutComponent,
        GraphSettingsComponent,
        TableSettingsComponent
    ],
    exports: [
        TableComponent
    ],
    entryComponents: [
        DialogActionsComponent,
        DialogAlertComponent,
        DialogPromptComponent,
        DialogSelectComponent,
        DialogSingleSelectComponent,
        StationPropertiesComponent,
        DeliveryPropertiesComponent,
        VisioLayoutComponent
    ]
})
export class TracingModule { }