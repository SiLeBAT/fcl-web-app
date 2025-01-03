import {
    Component,
    Input,
    ViewEncapsulation,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChanges,
} from "@angular/core";
import { Property } from "@app/tracing/data.model";

@Component({
    selector: "fcl-property-selector-view",
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: "./property-selector-view.component.html",
    styleUrls: ["./property-selector-view.component.scss"],
    encapsulation: ViewEncapsulation.None,
})
export class PropertySelectorViewComponent implements OnChanges {
    @Input() label: string | null = null;
    @Input() placeholder: string | null = null;
    @Input() disabled = false;
    @Input() value: string | null = null;
    @Input() favouriteProperties: Property[];
    @Input() otherProperties: Property[];

    @Output() valueChange = new EventEmitter<string>();

    isPropNotListed = false;
    isPropDataUnavailable = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (
            changes.value !== undefined ||
            changes.favouriteProperties !== undefined ||
            changes.otherProperties !== undefined
        ) {
            if (this.value === null) {
                this.isPropNotListed = false;
                this.isPropDataUnavailable = false;
            } else {
                const prop =
                    this.favouriteProperties.find((p) => p.id === this.value) ||
                    this.otherProperties.find((p) => p.id === this.value);
                this.isPropNotListed = !prop;
                this.isPropDataUnavailable =
                    !prop || prop.dataIsUnavailable === true;
            }
        }
    }

    onValueChange(value: string): void {
        this.valueChange.emit(value);
    }
}
