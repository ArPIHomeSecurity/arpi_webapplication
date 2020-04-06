# ArPI webapplication

The webappication to control the system (argus_server).

1. Running local demo  
The local demo server uses a mock REST API service, and you can control the sensors on the  web ui.

```bash
# run the demo application on localhost in development mode
export DIST=dist-demo-dev
ng build --configuration=demo-dev --localize
npm run postbuild
npm run serve

# or run the demo application on localhost
export DIST=dist-demo
ng build --configuration=demo --localize
npm run postbuild
npm run serve
```

2. Building the development application  
The development environment can be executed on any machine, because it uses mocked GPIO.
Build the webapplication and run the server and monitor components from the "server" project.

```bash
ng build --localize
npm run postbuild
```


3. Building the production application  

The production application is running on the Raspberry PI Zero device with full functionality.
Build the webapplication and install it to the Raspberry PI Zero with the management project.

```bash
ng build --configuration=production --localize
npm run compress
npm run postbuild
```

4. For using the development and prodcution application you have to use the ArPI server application.

* You can run the web application with the backend on your machine with mocked IOs. For development see: https://github.com/ArPIHomeSecurity/arpi_server

* You can deploy the webapplication to your Raspberry PI. For production see: https://github.com/ArPIHomeSecurity/arpi_management


5. Updateing translations

```bash
npm run extract-i18n
```

---

DEMO branch: [![Build Status](https://www.travis-ci.org/ArPIHomeSecurity/arpi_webapplication.svg?branch=demo)](https://www.travis-ci.org/ArPIHomeSecurity/arpi_webapplication)

Project web page: https://www.arpi-security.info/

See the demo application with partial funcionality: https://demo.arpi-security.info

<a href="https://www.paypal.me/gkovacs81/">
  <img alt="Support via PayPal" src="https://cdn.rawgit.com/twolfson/paypal-github-button/1.0.0/dist/button.svg"/>
</a>
