import { FclData } from './../datatypes';
import { IDataImporter } from './datatypes';
import { DataImporterV0 } from './data-importer-v0';
import { DataImporterV1 } from './data-importer-v1';
import { HttpClient } from '@angular/common/http';

export class DataImporter {

    static async preprocessData(data: any, fclData: FclData, httpClient: HttpClient): Promise<void> {
        for (const importer of this.getDataImporter(httpClient)) {
            const formatIsValid: boolean = await importer.isDataFormatSupported(data);
            if (formatIsValid) {
                await importer.preprocessData(data, fclData);
                return;
            }
        }
        throw new SyntaxError('Invalid data format');
    }

    private static getDataImporter(httpClient: HttpClient): IDataImporter[] {
        return [new DataImporterV1(httpClient), new DataImporterV0()];
    }
}
