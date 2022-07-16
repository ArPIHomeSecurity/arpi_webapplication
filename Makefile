
build-demo:
	ng build --configuration=demo-en
	ng build --configuration=demo-hu
	DIST=dist-development npm run postbuild

build-demo-dev:
	ng build --configuration=demo-dev --localize
	DIST=dist-demo-dev npm run postbuild
	DIST=dist-demo-dev npm run serve

start-demo-dev:
	DIST=dist-demo-dev npm run serve

build-development:
	ng build --localize

build-production:
	ng build --configuration=production --localize
	DIST=dist-production npm run postbuild
