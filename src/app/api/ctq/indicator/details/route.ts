/**
 * @file src/app/api/ctq/indicator/details/route.ts
 * @description 지표 상세 조회 API — 특정 월+모델의 IP_PRODUCT_WORK_QC 불량 이력
 *
 * 초보자 가이드:
 * 1. 대책서 OK 클릭 시 해당 모델의 불량 상세 레코드 조회
 * 2. IP_PRODUCT_2D_BARCODE JOIN으로 ITEM_CODE(모델) → SERIAL_NO 매핑
 * 3. F_GET_BASECODE / F_GET_WORKSTAGE_NAME 으로 코드 → 명칭 변환
 */

import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { executeQuery } from "@/lib/oracle";

export const dynamic = "force-dynamic";

interface DetailRow {
  QC_DATE: string;
  SERIAL_NO: string;
  MODEL_NAME: string;
  WORKSTAGE_NAME: string;
  RECEIPT_NAME: string;
  QC_RESULT_NAME: string;
  REPAIR_RESULT_NAME: string;
  LOCATION_CODE: string;
  DEFECT_ITEM_CODE: string;
  HANDLING_NAME: string;
  BAD_REASON_NAME: string;
  BAD_PHENOMENON: string;
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const month = url.searchParams.get("month") ?? "";
    const itemCode = url.searchParams.get("itemCode") ?? "";

    if (!month || !itemCode) {
      return NextResponse.json({ error: "month, itemCode 필수" }, { status: 400 });
    }

    /* 월 → Oracle 날짜 범위 */
    const [yy, mm] = month.split("/").map(Number);
    const start = new Date(yy, mm - 1, 1);
    const end = new Date(yy, mm, 1);
    const fmt = (d: Date) =>
      `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} 00:00:00`;

    const sql = `
      SELECT TO_CHAR(t.QC_DATE, 'YYYY/MM/DD HH24:MI:SS') AS QC_DATE,
             t.SERIAL_NO,
             NVL(t.MODEL_NAME, '-') AS MODEL_NAME,
             NVL(F_GET_WORKSTAGE_NAME(t.WORKSTAGE_CODE), NVL(t.WORKSTAGE_CODE, '-')) AS WORKSTAGE_NAME,
             NVL(F_GET_BASECODE('RECEIPT DEFICIT', t.RECEIPT_DEFICIT, 'C', 1), NVL(t.RECEIPT_DEFICIT, '-')) AS RECEIPT_NAME,
             NVL(F_GET_BASECODE('QC RESULT', t.QC_RESULT, 'C', 1), NVL(t.QC_RESULT, '-')) AS QC_RESULT_NAME,
             NVL(F_GET_BASECODE('REPAIR RESULT CODE', t.REPAIR_RESULT_CODE, 'C', 1), NVL(t.REPAIR_RESULT_CODE, '-')) AS REPAIR_RESULT_NAME,
             NVL(t.LOCATION_CODE, '-') AS LOCATION_CODE,
             NVL(t.DEFECT_ITEM_CODE, '-') AS DEFECT_ITEM_CODE,
             NVL(F_GET_BASECODE('QC INSPECT HANDLING', t.QC_INSPECT_HANDLING, 'C', 1), NVL(t.QC_INSPECT_HANDLING, '-')) AS HANDLING_NAME,
             NVL(F_GET_CODE_MASTER('WQC BAD REASON CODE', t.BAD_REASON_CODE, 'C', 1), NVL(t.BAD_REASON_CODE, '-')) AS BAD_REASON_NAME,
             NVL(t.BAD_PHENOMENON, '-') AS BAD_PHENOMENON
      FROM IP_PRODUCT_WORK_QC t
      WHERE t.QC_DATE >= TO_DATE(:startStr, 'YYYY/MM/DD HH24:MI:SS')
        AND t.QC_DATE < TO_DATE(:endStr, 'YYYY/MM/DD HH24:MI:SS')
        AND t.SERIAL_NO IN (
          SELECT b.SERIAL_NO FROM IP_PRODUCT_2D_BARCODE b
          WHERE b.ITEM_CODE = :itemCode
        )
      ORDER BY t.QC_DATE DESC
      FETCH FIRST 200 ROWS ONLY
    `;

    const rows = await executeQuery<DetailRow>(sql, {
      startStr: fmt(start),
      endStr: fmt(end),
      itemCode,
    });

    return NextResponse.json({
      records: rows.map((r) => ({
        qcDate: r.QC_DATE,
        serialNo: r.SERIAL_NO,
        modelName: r.MODEL_NAME,
        workstageName: r.WORKSTAGE_NAME,
        receiptName: r.RECEIPT_NAME,
        qcResultName: r.QC_RESULT_NAME,
        repairResultName: r.REPAIR_RESULT_NAME,
        locationCode: r.LOCATION_CODE,
        defectItemCode: r.DEFECT_ITEM_CODE,
        handlingName: r.HANDLING_NAME,
        badReasonName: r.BAD_REASON_NAME,
        badPhenomenon: r.BAD_PHENOMENON,
      })),
      total: rows.length,
    });
  } catch (error) {
    console.error("Indicator details API error:", error);
    return NextResponse.json(
      { error: "상세 조회 실패", detail: String(error) },
      { status: 500 }
    );
  }
}
