#/bin/bash

if [[ "$#" -ne 1 ]]; then
	echo "Usage: docker-ctl [CMD]"
	exit 2
fi
if [[ "$1" = "start" ]] || [[ "$1" = "start-headless" ]]; then
	cp docker-compose.yml ..
	cp Dockerfile ..
	cp .dockerignore ..
	cd ..
	if [ "$1" = "start" ]; then
		docker-compose up
	else
		docker-compose up -d
	fi

elif [[ "$1" = "stop" ]]; then
	cd ..
	docker-compose down -v --rmi local

else
	echo "Invalid command argument: $1"

fi

