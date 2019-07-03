build-image:
	docker build -t conclave .

run-local: build-image server

server:
	docker run --rm -p 3000:3000 conclave npm start

