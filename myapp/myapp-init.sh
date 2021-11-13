#!/bin/sh -e
# wait-for-postgres.sh
# Adapted from https://docs.docker.com/compose/startup-order/

# Expects the necessary PG* variables.

echo 'Waiting for postgres'

until PGPASSWORD=pass psql -c '\l' -h db -p 5432 -U plant_detection_dbuser plant_detection_db; do
  echo >&2 "$(date +%Y%m%dt%H%M%S) Postgres is unavailable - sleeping"
  sleep 1
done
echo >&2 "$(date +%Y%m%dt%H%M%S) Postgres is up - executing command"



echo 'running db:migrate'
npx sequelize-cli db:migrate

echo 'running db:seed:all'
npx sequelize-cli db:seed:all


echo 'Starting npm'
npm run start
