/**
 * @trigger TRG_IQ_DAILY_NOTIFY_INSUPD
 * @description IQ_DAILY_NOTIFY 테이블 INSERT/UPDATE 시
 *              COMPLETE_YN = 'Y' 전환되면 해당 SERIAL_NO의
 *              검사 RAW 테이블에 QC_CONFIRM_YN/QC_CONFIRM_DATE 업데이트
 *
 * 목적:
 *   - CTQ 모니터링에서 조치 완료된 불량을 제외하기 위함
 *   - 각 공정 RAW 테이블의 QC_CONFIRM_YN = 'Y' 인 건은 모니터링 쿼리에서 제외됨
 *
 * 대상 공정 (7개):
 *   ICT    → IQ_MACHINE_ICT_SERVER_DATA_RAW       (PID)
 *   FT     → IQ_MACHINE_FT1_SMPS_DATA_RAW         (PID)
 *   ATE    → IQ_MACHINE_ATE_SERVER_DATA_RAW        (PID)
 *   IMG    → IQ_MACHINE_INSPECT_DATA_PBA_FT        (BARCODE)
 *   SETTV  → IQ_MACHINE_INSPECT_DATA_PBA_TVSET     (BARCODE)
 *   HIPOT  → IQ_MACHINE_HIPOT_POWER_DATA_RAW       (PID)
 *   BURNIN → IQ_MACHINE_BURNIN_SMPS_DATA_RAW       (PID)
 *
 * 동작 조건:
 *   - INSERT: COMPLETE_YN = 'Y' 인 경우 실행
 *   - UPDATE: COMPLETE_YN 이 'Y' 가 아닌 값에서 'Y' 로 변경된 경우만 실행
 *
 * @author HSYou
 * @date 2026-03-12
 */
CREATE OR REPLACE TRIGGER TRG_IQ_DAILY_NOTIFY_INSUPD
AFTER INSERT OR UPDATE ON IQ_DAILY_NOTIFY
REFERENCING OLD AS OLD NEW AS NEW
FOR EACH ROW
DECLARE
  v_ws_name VARCHAR2(30);  -- WORKSTAGE_CODE에 대응하는 WORKSTAGE_NAME
BEGIN
  /*──────────────────────────────────────────────
   * 1. 실행 조건 확인
   *    - COMPLETE_YN = 'Y' 가 아니면 무시
   *    - UPDATE 시 이미 'Y' 였으면 중복 실행 방지
   *──────────────────────────────────────────────*/
  IF :NEW.COMPLETE_YN != 'Y' THEN
    RETURN;
  END IF;

  IF UPDATING AND NVL(:OLD.COMPLETE_YN, 'N') = 'Y' THEN
    RETURN;
  END IF;

  /*──────────────────────────────────────────────
   * 2. WORKSTAGE_CODE → WORKSTAGE_NAME 변환
   *    IP_PRODUCT_WORKSTAGE 테이블에서 공정명 조회
   *──────────────────────────────────────────────*/
  BEGIN
    SELECT WORKSTAGE_NAME
      INTO v_ws_name
      FROM IP_PRODUCT_WORKSTAGE
     WHERE WORKSTAGE_CODE = :NEW.WORKSTAGE_CODE
       AND ROWNUM = 1;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      -- 매핑되지 않는 공정코드는 처리 대상 아님
      RETURN;
  END;

  /*──────────────────────────────────────────────
   * 3. 공정별 RAW 테이블 UPDATE
   *    QC_CONFIRM_YN  = 'Y'     → 모니터링 제외 플래그
   *    QC_CONFIRM_DATE = SYSDATE → 확인 처리 일시
   *──────────────────────────────────────────────*/

  -- ICT 공정
  IF v_ws_name = 'ICT' THEN
    UPDATE IQ_MACHINE_ICT_SERVER_DATA_RAW
       SET QC_CONFIRM_YN   = 'Y',
           QC_CONFIRM_DATE = SYSDATE
     WHERE PID = :NEW.SERIAL_NO;

  -- FT#1 공정
  ELSIF v_ws_name = 'FT' THEN
    UPDATE IQ_MACHINE_FT1_SMPS_DATA_RAW
       SET QC_CONFIRM_YN   = 'Y',
           QC_CONFIRM_DATE = SYSDATE
     WHERE PID = :NEW.SERIAL_NO;

  -- ATE 공정
  ELSIF v_ws_name = 'ATE' THEN
    UPDATE IQ_MACHINE_ATE_SERVER_DATA_RAW
       SET QC_CONFIRM_YN   = 'Y',
           QC_CONFIRM_DATE = SYSDATE
     WHERE PID = :NEW.SERIAL_NO;

  -- IMAGE 공정 (PID 컬럼명: BARCODE)
  ELSIF v_ws_name = 'IMG' THEN
    UPDATE IQ_MACHINE_INSPECT_DATA_PBA_FT
       SET QC_CONFIRM_YN   = 'Y',
           QC_CONFIRM_DATE = SYSDATE
     WHERE BARCODE = :NEW.SERIAL_NO;

  -- SET 검사 공정 (PID 컬럼명: BARCODE)
  ELSIF v_ws_name = 'SETTV' THEN
    UPDATE IQ_MACHINE_INSPECT_DATA_PBA_TVSET
       SET QC_CONFIRM_YN   = 'Y',
           QC_CONFIRM_DATE = SYSDATE
     WHERE BARCODE = :NEW.SERIAL_NO;

  -- HIPOT 공정
  ELSIF v_ws_name = 'HIPOT' THEN
    UPDATE IQ_MACHINE_HIPOT_POWER_DATA_RAW
       SET QC_CONFIRM_YN   = 'Y',
           QC_CONFIRM_DATE = SYSDATE
     WHERE PID = :NEW.SERIAL_NO;

  -- BURN-IN 공정
  ELSIF v_ws_name = 'BURNIN' THEN
    UPDATE IQ_MACHINE_BURNIN_SMPS_DATA_RAW
       SET QC_CONFIRM_YN   = 'Y',
           QC_CONFIRM_DATE = SYSDATE
     WHERE PID = :NEW.SERIAL_NO;

  END IF;

END TRG_IQ_DAILY_NOTIFY_INSUPD;
/
