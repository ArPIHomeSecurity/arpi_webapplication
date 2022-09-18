
start-demo-dev:
	ng build --configuration=demo-dev --localize
	DIST=dist-demo-dev npm run serve

start-development:
	ng build --localize
	DIST=dist-development npm run serve
