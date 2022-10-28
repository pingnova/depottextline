#!/sbin/openrc-run
  
name="depottextline"
directory="/opt/depottextline"
command="/opt/depottextline/start.sh"
output_log=/home/cyberian/depottextline.log
error_log=/home/cyberian/depottextline.log
pidfile="/var/run/depottextline.pid"
supervisor=supervise-daemon 