const commonSettings = {
  instances: 1,
  exec_mode: 'fork',
  watch: false,
  log_date_format: 'YYYY-MM-DD HH:mm:ss',
  max_memory_restart: '1G',

  max_restarts: 5,
  restart_delay: 10000,
  min_uptime: 5000,
  autorestart: true,

  // Next 기본은 ready 신호 안 보냄
  wait_ready: false,

  kill_timeout: 8000,
  merge_logs: true,
  node_args: ['--enable-source-maps'],
  time: true,

  // 로그 설정 (Winston으로 대체하여 PM2 로그 비활성화)
  log_file: '/dev/null',
  error_file: '/dev/null',
  out_file: '/dev/null'
};

module.exports = {
  apps: [
    {
      ...commonSettings,
      name: 'portfolio-next',
      // 서버에서 직접 빌드 후 next start로 실행
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/home/ec2-user/bbagyun-portfolio-v2'
    }
  ]
};
