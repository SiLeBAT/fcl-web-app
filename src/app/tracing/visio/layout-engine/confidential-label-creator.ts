import { StationInformation, LotInformation,
    VisioLabel } from './datatypes';
import { LabelCreator } from './label-creator';
import { GraphSettings } from './graph-settings';

export class ConfidentialLabelCreator extends LabelCreator {
    constructor(canvas: any) {
        super(canvas);
    }

    getLotLabel(lotInfo: LotInformation): VisioLabel {
        const text: string[] = [
            lotInfo.commonProductName || 'Unknown product name',
            'brand name: ' + (lotInfo.brandName || 'unknown'),
            'Lot: ' + (lotInfo.lotIdentifier || 'unknown'),
            'Amount: ' + (lotInfo.quantity || 'unknown')
        ];
        return this.getLabel(text, GraphSettings.LOT_BOX_MARGIN);
    }

    getStationLabel(stationInfo: StationInformation): VisioLabel {
        const text: string[] = [
            (stationInfo.activities || 'Unknown activity') +
            ' ' + stationInfo.ctno + ': ' + (stationInfo.name || 'Unknown FBO')
        ];
        return this.getLabel(text, GraphSettings.STATION_BOX_MARGIN);
    }
}
