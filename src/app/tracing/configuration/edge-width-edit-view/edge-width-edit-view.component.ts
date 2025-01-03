import {
    ChangeDetectionStrategy,
    Component,
    OnChanges,
    SimpleChanges,
} from "@angular/core";
import { AbstractRuleEditViewComponent } from "../abstract-rule-edit-view";
import { EdgeWidthEditRule } from "../model";
import { ValueType } from "@app/tracing/data.model";

@Component({
    selector: "fcl-edge-width-edit-view",
    templateUrl: "./edge-width-edit-view.component.html",
    styleUrls: ["./edge-width-edit-view.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EdgeWidthEditViewComponent
    extends AbstractRuleEditViewComponent<EdgeWidthEditRule>
    implements OnChanges
{
    private static readonly DISABLED_ACTION_TOOLTIP =
        "Please enter name, select a property as well as a value type";

    get valueType(): typeof ValueType {
        return ValueType;
    }

    get disabledActionToolTip(): string {
        return EdgeWidthEditViewComponent.DISABLED_ACTION_TOOLTIP;
    }

    get propertyName(): string | null {
        return this.rule?.propertyName ?? null;
    }
    get scale(): ValueType | null {
        return this.rule?.scale ?? null;
    }
    get minimumZero(): boolean | undefined {
        return this.rule?.minimumZero;
    }
    get maximum(): number | undefined {
        return this.rule?.maximum;
    }

    constructor() {
        super();
    }

    ngOnChanges(changes: SimpleChanges): void {
        super.ngOnChanges(changes);
    }

    onPropertyChange(property: string): void {
        this.changeRule({ propertyName: property });
    }
    onScaleChange(scale: ValueType): void {
        this.changeRule({ scale: scale });
    }
    onMinimumZeroChange(minimumZero: boolean): void {
        this.changeRule({ minimumZero: minimumZero });
    }
    onMaximumChange(maximum: number): void {
        this.changeRule({ maximum: maximum });
    }
}
