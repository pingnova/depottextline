

sudo -u postgres psql -d depottextline -c "DROP TABLE remote_numbers;"
sudo -u postgres psql -d depottextline -c "DROP TABLE messages;"
sudo -u postgres psql -d depottextline -c "DROP TABLE login_tokens;"
sudo -u postgres psql -d depottextline -c "DROP TABLE sessions;"
sudo -u postgres psql -d depottextline -c "DROP TABLE accounts;"
sudo -u postgres psql -d depottextline -c "DROP TABLE schemaversion;"

