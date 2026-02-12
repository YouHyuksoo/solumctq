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

export async function executeQuery<T>(
  sql: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const pool = await getPool();
  let connection;
  try {
    connection = await pool.getConnection();
    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    return (result.rows as T[]) || [];
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
