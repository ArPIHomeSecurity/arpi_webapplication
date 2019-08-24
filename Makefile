

build-demo:
	ng build --configuration=demo-en
	ng build --configuration=demo-hu

build-development:
	ng build --configuration=development

build-production:
	npm run build-default-language
	npm run build-translations
	npm run build-compress
