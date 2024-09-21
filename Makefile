########################################################################################################################
# Docker compose management commands.
########################################################################################################################

build:
	docker-compose build --no-cache

up:
	docker-compose up -d app mongo

up-dev:
	docker-compose up -d app_dev mongo

logs:
	docker-compose logs -f app

logs-dev:
	docker-compose logs -f app_dev

down:
	docker-compose down