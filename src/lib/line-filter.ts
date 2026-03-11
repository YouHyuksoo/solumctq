/**
 * @file src/lib/line-filter.ts
 * @description 라인 필터 SQL 조건 생성 유틸
 *
 * 초보자 가이드:
 * 1. **parseLines**: URL query에서 라인 코드 배열 파싱
 * 2. **buildLineInClause**: IN 조건 SQL + bind params 생성
 */

import { type NextRequest } from "next/server";

/** URL query parameter에서 라인 코드 배열 파싱 */
export function parseLines(request: NextRequest): string[] {
  const linesParam = request.nextUrl.searchParams.get("lines");
  if (!linesParam) return [];
  return linesParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * LINE_CODE IN (...) 조건 + bind params 생성
 * @param lines - 라인 코드 배열
 * @param alias - SQL 테이블 별칭 (기본 "t")
 * @param prefix - bind 파라미터 접두사 (기본 "ln")
 * @returns { clause, params } — clause가 빈 문자열이면 필터 없음
 */
export function buildLineInClause(
  lines: string[],
  alias: string = "t",
  prefix: string = "ln"
): { clause: string; params: Record<string, string> } {
  if (lines.length === 0) return { clause: "", params: {} };

  const placeholders = lines.map((_, i) => `:${prefix}${i}`).join(",");
  const params: Record<string, string> = {};
  lines.forEach((code, i) => {
    params[`${prefix}${i}`] = code;
  });

  return {
    clause: `AND ${alias}.LINE_CODE IN (${placeholders})`,
    params,
  };
}
