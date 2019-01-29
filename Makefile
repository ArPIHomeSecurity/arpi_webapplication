

build-demo:
	ng build --configuration=demo --output-path dist-demo --base-href  "https://demo.arpi-security.info"

	ng build --configuration=demo \
			 --output-path=dist-demo/hu \
			 --aot \
			 --base-href "https://demo.arpi-security.info/hu/" \
			 --i18n-file=src/locales/messages.hu.xlf \
			 --i18n-format=xlf \
			 --i18n-locale=hu