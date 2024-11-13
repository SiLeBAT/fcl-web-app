import { IMPORT_ISSUES, ISSUE_AGGREGATORS } from "./consts";
import { ImportIssue, ImportResult } from "./model";
import { removeUndefined } from "../../../../tracing/util/non-ui-utils";
import { SHEET_LABELS } from "./all-in-one/const";

interface IssueGroup {
    msg: string;
    stationIssues: ImportIssue[];
    deliveryIssues: ImportIssue[];
    del2delIssues: ImportIssue[];
}

function getTextForIssueGroup(issueGroup: IssueGroup): string {
    switch (issueGroup.msg) {
        case IMPORT_ISSUES.nonUniquePrimaryKey:
            return ISSUE_AGGREGATORS.duplicatePrimaryIDs([
                ...(issueGroup.stationIssues.length > 0
                    ? [
                          {
                              name: SHEET_LABELS.stations,
                              duplicateIds: Array.from(
                                  new Set(
                                      issueGroup.stationIssues.map(
                                          (issue) =>
                                              issue.value?.toString() ?? "",
                                      ),
                                  ),
                              ),
                          },
                      ]
                    : []),
                ...(issueGroup.deliveryIssues.length > 0
                    ? [
                          {
                              name: SHEET_LABELS.deliveries,
                              duplicateIds: Array.from(
                                  new Set(
                                      issueGroup.deliveryIssues.map(
                                          (issue) =>
                                              issue.value?.toString() ?? "",
                                      ),
                                  ),
                              ),
                          },
                      ]
                    : []),
            ]);
        default:
            return "";
    }
}

function getIssuesByType(
    stationIssues: ImportIssue[],
    deliveryIssues: ImportIssue[],
    del2delIssues: ImportIssue[],
    type: string,
): IssueGroup {
    const predicate = (issue: ImportIssue) => issue.msg === type;
    return {
        msg: type,
        stationIssues: stationIssues.filter(predicate),
        deliveryIssues: deliveryIssues.filter(predicate),
        del2delIssues: del2delIssues.filter(predicate),
    };
}

function collectIssues(importResult: ImportResult): IssueGroup[] {
    const { issues: stationIssues } = importResult.stations;
    const { issues: deliveryIssues } = importResult.deliveries;
    const { issues: del2delIssues } = importResult.del2Dels;
    const allIssues = [...stationIssues, ...deliveryIssues, ...del2delIssues];
    const types = removeUndefined(
        Array.from(new Set(allIssues.map((issue) => issue.msg))),
    );

    return types.map((type) =>
        getIssuesByType(stationIssues, deliveryIssues, del2delIssues, type),
    );
}

export function getWarnings(importResult: ImportResult): string[] {
    return collectIssues(importResult).map(getTextForIssueGroup);
}
