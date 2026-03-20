/**
 * @file ecosystem.config.cjs
 * @description PM2 프로세스 관리 설정 — CTQ 모니터링 (Next.js)
 *
 * 초보자 가이드:
 * 1. `pm2 start ecosystem.config.cjs` — 서비스 시작
 * 2. `pm2 restart ctq-web`            — 재시작
 * 3. `pm2 logs ctq-web`               — 실시간 로그 확인
 * 4. `pm2 status`                      — 프로세스 상태 확인
 * 5. `pm2 stop ctq-web`               — 중지
 */
module.exports = {
  apps: [
    {
      name: 'ctq-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3000',
      cwd: __dirname,
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      exec_mode: 'fork',
      windowsHide: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: 'logs/ctq-error.log',
      out_file: 'logs/ctq-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
