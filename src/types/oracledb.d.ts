/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "oracledb" {
  export const OUT_FORMAT_OBJECT: number;
  export let outFormat: number;

  export interface Pool {
    getConnection(): Promise<Connection>;
    close(drainTime?: number): Promise<void>;
  }

  export interface Connection {
    execute(sql: string, params?: any, options?: any): Promise<{ rows?: any[] }>;
    close(): Promise<void>;
  }

  export function createPool(config: any): Promise<Pool>;
}
