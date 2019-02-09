

build-demo:
	ng build --configuration=demo-en
	ng build --configuration=demo-hu

build-demo-localhost:
	ng build --configuration=demo-en --base-href=http://localhost/
	ng build --configuration=demo-hu --base-href=http://localhost/hu/

build-demo-dev:
	ng build --configuration=demo-dev

build-prod:
	ng build --configuration=production-en
	ng build --configuration=production-hu