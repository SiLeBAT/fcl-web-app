import { Component, Inject, OnInit } from "@angular/core";
import {
    MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
    MatLegacyDialogRef as MatDialogRef,
} from "@angular/material/legacy-dialog";

export interface DialogYesNoData {
    title: string;
    position: {
        top: string;
        left: string;
    };
}

@Component({
    templateUrl: "./dialog-yes-no.component.html",
})
export class DialogYesNoComponent implements OnInit {
    dialogData: DialogYesNoData;

    constructor(
        public dialogRef: MatDialogRef<DialogYesNoComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogYesNoData,
    ) {}

    ngOnInit() {
        this.dialogData = this.data;
        const rightMostPos =
            window.innerWidth - Number(this.dialogData.position.left);
        this.dialogRef.updatePosition({
            top: `${this.dialogData.position.top}px`,
            right: `${rightMostPos}px`,
        });
    }
}
