#!/sbin/openrc-run
  
name="depottextline"
directory="/opt/depottextline"
command="pipenv run flask run"
output_log=/home/cyberian/depottextline.log
error_log=/home/cyberian/depottextline.log
pidfile="/var/run/depottextline.pid"
supervisor=supervise-daemon 