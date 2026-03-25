/**
 * @file src/lib/oracle.ts
 * @description Oracle DB 연결 유틸리티 (oracledb thin mode + Connection Pool)
 *
 * 초보자 가이드:
 * 1. **연결 방식**: oracledb thin 모드 (Oracle Client 불필요)
 * 2. **Connection Pool**: 최초 1회 풀 생성 → 이후 연결 재사용 (성능 핵심)
 * 3. **사용법**: executeQuery()로 쿼리 실행 (풀에서 자동 연결 할당/반환)
 */

import oracledb from "oracledb";

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const poolConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE}`,
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 60,
  poolPingInterval: 30,
  expireTime: 30,
  queueTimeout: 30000,
};

let poolPromise: Promise<oracledb.Pool> | null = null;

function getPool(): Promise<oracledb.Pool> {
  if (!poolPromise) {
    poolPromise = oracledb.createPool(poolConfig).catch((err) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

/** BLOB 컬럼 포함 쿼리 실행 (이미지 등 바이너리 데이터 조회용) */
export async function executeBlobQuery<T>(
  sql: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  let pool: oracledb.Pool;
  try {
    pool = await getPool();
  } catch {
    poolPromise = null;
    pool = await getPool();
  }
  let connection;
  try {
    connection = await pool.getConnection();
    (connection as unknown as { callTimeout: number }).callTimeout = 60000;
    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      fetchInfo: { BLOB_DATA: { type: oracledb.BUFFER } },
    });
    return (result.rows as T[]) || [];
  } catch (err: unknown) {
    const e = err as { code?: string; isRecoverable?: boolean };
    if (e.code === "NJS-500" || e.code === "NJS-501" || e.isRecoverable) {
      poolPromise = null;
    }
    throw err;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

export async function executeQuery<T>(
  sql: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  let pool: oracledb.Pool;
  try {
    pool = await getPool();
  } catch {
    poolPromise = null;
    pool = await getPool();
  }
  let connection;
  try {
    connection = await pool.getConnection();
    (connection as unknown as { callTimeout: number }).callTimeout = 60000;
    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
    });
    return (result.rows as T[]) || [];
  } catch (err: unknown) {
    const e = err as { code?: string; isRecoverable?: boolean };
    if (e.code === "NJS-500" || e.code === "NJS-501" || e.isRecoverable) {
      poolPromise = null;
    }
    throw err;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
