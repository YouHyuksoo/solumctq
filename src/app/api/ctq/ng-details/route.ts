/**
 * @file src/app/api/ctq/ng-details/route.ts
 * @description NG 상세 전체 조회 API - 클릭 모달용
 *
 * 초보자 가이드:
 * 1. **용도**: 카드 클릭 시 해당 라인/공정의 전체 NG 레코드 조회
 * 2. **파라미터**: type(공정타입), lineCode(라인코드), defectItem/badReasonCode(선택)
 * 3. **응답**: IP_PRODUCT_WORK_QC JOIN 결과 전체 (최대 200건)
 */

import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { executeQuery } from "@/lib/oracle";

export const dynamic = "force-dynamic";

interface ProcessConfig {
  table: string;
  pidCol: string;
  dateCol: string;
  resultCol: string;
  dateType: "varchar" | "date";
}

const RAW_CONFIGS: Record<string, ProcessConfig> = {
  FT: { table: "IQ_MACHINE_FT1_SMPS_DATA_RAW", pidCol: "PID", dateCol: "INSPECT_DATE", resultCol: "INSPECT_RESULT", dateType: "varchar" },
  ATE: { table: "IQ_MACHINE_ATE_SERVER_DATA_RAW", pidCol: "PID", dateCol: "INSPECT_DATE", resultCol: "INSPECT_RESULT", dateType: "varchar" },
  IMAGE: { table: "IQ_MACHINE_INSPECT_DATA_PBA_FT", pidCol: "BARCODE", dateCol: "STARTTIME", resultCol: "RESULT", dateType: "date" },
  SETTV: { table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET", pidCol: "BARCODE", dateCol: "INSPECT_TIME", resultCol: "INSPECT_RESULT", dateType: "date" },
  HIPOT: { table: "IQ_MACHINE_HIPOT_POWER_DATA_RAW", pidCol: "PID", dateCol: "INSPECT_DATE", resultCol: "INSPECT_RESULT", dateType: "varchar" },
  BURNIN: { table: "IQ_MACHINE_BURNIN_SMPS_DATA_RAW", pidCol: "PID", dateCol: "INSPECT_DATE", resultCol: "INSPECT_RESULT", dateType: "varchar" },
};

interface NgRow {
  INSPECT_TIME: string;
  PID: string;
  MODEL_NAME: string;
  RECEIPT_DEFICIT: string;
  LOCATION_CODE: string;
  REPAIR_RESULT_CODE: string;
  QC_INSPECT_HANDLING: string;
  DEFECT_ITEM_CODE: string;
  INSPECT_RESULT: string;
}

/** 오늘 08:00 기준 시작/종료 */
function getTimeRange() {
  const now = new Date();
  if (now.getHours() < 8) now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const next = new Date(y, now.getMonth(), now.getDate() + 1);
  const ny = next.getFullYear();
  const nm = String(next.getMonth() + 1).padStart(2, "0");
  const nd = String(next.getDate()).padStart(2, "0");
  return {
    startStr: `${y}/${m}/${d} 08:00:00`,
    endStr: `${ny}/${nm}/${nd} 08:00:00`,
  };
}

function getTimeRanges90() {
  const now = new Date();
  if (now.getHours() < 8) now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const fmt = (dt: Date) => {
    return `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")} 08:00:00`;
  };
  return { start90: fmt(new Date(y, m, d - 90)), dayEnd: fmt(new Date(y, m, d + 1)) };
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const type = url.searchParams.get("type") ?? "";
    const lineCode = url.searchParams.get("lineCode") ?? "";
    const defectItem = url.searchParams.get("defectItem");
    const badReasonCode = url.searchParams.get("badReasonCode");

    if (!lineCode) {
      return NextResponse.json({ error: "lineCode 필수" }, { status: 400 });
    }

    let rows: NgRow[];

    if (type === "material") {
      const times = getTimeRanges90();
      const sql = `
        SELECT TO_CHAR(t.QC_DATE, 'YYYY/MM/DD HH24:MI:SS') AS INSPECT_TIME,
               t.SERIAL_NO AS PID,
               NVL(t.MODEL_NAME, '-') AS MODEL_NAME,
               NVL(t.RECEIPT_DEFICIT, '-') AS RECEIPT_DEFICIT,
               NVL(t.LOCATION_CODE, '-') AS LOCATION_CODE,
               NVL(t.REPAIR_RESULT_CODE, '-') AS REPAIR_RESULT_CODE,
               NVL(t.QC_INSPECT_HANDLING, '-') AS QC_INSPECT_HANDLING,
               NVL(t.DEFECT_ITEM_CODE, '-') AS DEFECT_ITEM_CODE,
               '-' AS INSPECT_RESULT
        FROM IP_PRODUCT_WORK_QC t
        WHERE t.QC_DATE >= TO_DATE(:tsStart, 'YYYY/MM/DD HH24:MI:SS')
          AND t.QC_DATE < TO_DATE(:tsEnd, 'YYYY/MM/DD HH24:MI:SS')
          AND t.LINE_CODE = :lineCode
          AND t.DEFECT_ITEM_CODE = :defectItem
        ORDER BY t.QC_DATE DESC
        FETCH FIRST 200 ROWS ONLY
      `;
      rows = await executeQuery<NgRow>(sql, {
        tsStart: times.start90,
        tsEnd: times.dayEnd,
        lineCode,
        defectItem: defectItem ?? "",
      });
    } else if (type === "open-short") {
      const tr = getTimeRange();
      const sql = `
        SELECT TO_CHAR(t.QC_DATE, 'YYYY/MM/DD HH24:MI:SS') AS INSPECT_TIME,
               t.SERIAL_NO AS PID,
               NVL(t.MODEL_NAME, '-') AS MODEL_NAME,
               NVL(t.RECEIPT_DEFICIT, '-') AS RECEIPT_DEFICIT,
               NVL(t.LOCATION_CODE, '-') AS LOCATION_CODE,
               NVL(t.REPAIR_RESULT_CODE, '-') AS REPAIR_RESULT_CODE,
               NVL(t.QC_INSPECT_HANDLING, '-') AS QC_INSPECT_HANDLING,
               NVL(t.DEFECT_ITEM_CODE, '-') AS DEFECT_ITEM_CODE,
               '-' AS INSPECT_RESULT
        FROM IP_PRODUCT_WORK_QC t
        WHERE t.QC_DATE >= TO_DATE(:tsStart, 'YYYY/MM/DD HH24:MI:SS')
          AND t.BAD_REASON_CODE = :badReasonCode
          AND t.LINE_CODE = :lineCode
        ORDER BY t.QC_DATE DESC
        FETCH FIRST 200 ROWS ONLY
      `;
      rows = await executeQuery<NgRow>(sql, {
        tsStart: tr.startStr,
        lineCode,
        badReasonCode: badReasonCode ?? "",
      });
    } else {
      const config = RAW_CONFIGS[type];
      if (!config) {
        return NextResponse.json({ error: `알 수 없는 type: ${type}` }, { status: 400 });
      }
      const tr = getTimeRange();
      const dateCondition = config.dateType === "varchar"
        ? `t.${config.dateCol} >= :tsStart AND t.${config.dateCol} < :tsEnd`
        : `t.${config.dateCol} >= TO_DATE(:tsStart, 'YYYY/MM/DD HH24:MI:SS') AND t.${config.dateCol} < TO_DATE(:tsEnd, 'YYYY/MM/DD HH24:MI:SS')`;
      const timeExpr = config.dateType === "date"
        ? `TO_CHAR(t.${config.dateCol}, 'YYYY/MM/DD HH24:MI:SS')`
        : `t.${config.dateCol}`;

      const sql = `
        SELECT ${timeExpr} AS INSPECT_TIME,
               t.${config.pidCol} AS PID,
               NVL(r.MODEL_NAME, '-') AS MODEL_NAME,
               NVL(r.RECEIPT_DEFICIT, '-') AS RECEIPT_DEFICIT,
               NVL(r.LOCATION_CODE, '-') AS LOCATION_CODE,
               NVL(r.REPAIR_RESULT_CODE, '-') AS REPAIR_RESULT_CODE,
               NVL(r.QC_INSPECT_HANDLING, '-') AS QC_INSPECT_HANDLING,
               NVL(r.DEFECT_ITEM_CODE, '-') AS DEFECT_ITEM_CODE,
               t.${config.resultCol} AS INSPECT_RESULT
        FROM ${config.table} t
        LEFT JOIN IP_PRODUCT_WORK_QC r
          ON r.SERIAL_NO = t.${config.pidCol}
          AND r.RECEIPT_DEFICIT = '2'
        WHERE ${dateCondition}
          AND t.${config.resultCol} NOT IN ('PASS', 'GOOD', 'OK')
          AND (t.QC_CONFIRM_YN IS NULL OR t.QC_CONFIRM_YN != 'Y')
          AND t.LINE_CODE = :lineCode
        ORDER BY t.${config.dateCol} DESC
        FETCH FIRST 200 ROWS ONLY
      `;
      rows = await executeQuery<NgRow>(sql, {
        tsStart: tr.startStr,
        tsEnd: tr.endStr,
        lineCode,
      });
    }

    return NextResponse.json({
      records: rows.map((r) => ({
        time: r.INSPECT_TIME,
        pid: r.PID,
        model: r.MODEL_NAME,
        receiptDeficit: r.RECEIPT_DEFICIT,
        locationCode: r.LOCATION_CODE,
        repairResult: r.REPAIR_RESULT_CODE,
        qcHandling: r.QC_INSPECT_HANDLING,
        defectItem: r.DEFECT_ITEM_CODE,
        inspectResult: r.INSPECT_RESULT,
      })),
      total: rows.length,
    });
  } catch (error) {
    console.error("NG Details API error:", error);
    return NextResponse.json(
      { error: "데이터 조회 실패", detail: String(error) },
      { status: 500 }
    );
  }
}
