// File needs to be CommonJs
const fs = require("fs");

function createIndexHtml(indexHtmlPath) {
  console.log("Creating index.html file: ", indexHtmlPath);

  const htmlContent = `
  <script type="text/javascript">
      // const currentLocale = navigator.language;
      const currentLocale = window.localStorage.getItem("localeId");
      console.log("INDEX: Current language: ", currentLocale)
      if (currentLocale === "hu") {
          location.pathname = "/hu/index.html";
          console.log("Moving to: HU")
      }
      else if (currentLocale === "it") {
          location.pathname = "/it/index.html";
          console.log("Moving to: IT")
      }
      else{
          location.pathname = "/en/index.html";
          console.log("Moving to: EN")
      }
  </script>
  `;

  fs.writeFile(indexHtmlPath, htmlContent, (error) => {
    if (error) {
      throw new Error(`Error writing file: ${indexHtmlPath}`, { cause: error });
    } else {
      console.log("Successfully created file:", indexHtmlPath);
    }
  });
}

async function copyApplicationFiles(sourcePath, destinationPath) {
  console.log("Copying application files from ", sourcePath, " to ", destinationPath);
  
  try {
    if (fs.existsSync(destinationPath)) {
      await fs.promises.rm(destinationPath, { recursive: true });
    }
    await fs.promises.mkdir(destinationPath, { recursive: true });

    const files = await fs.promises.readdir(sourcePath);
    // console.log("Files: ", files);

    for (const file of files) {
      const sourceFile = `${sourcePath}/${file}`;
      const destinationFile = `${destinationPath}/${file}`;
      const stat = await fs.promises.stat(sourceFile);

      if (stat.isDirectory()) {
        await copyApplicationFiles(sourceFile, destinationFile);
      } else {
        await fs.promises.copyFile(sourceFile, destinationFile);
      }
    }

    console.log("Finished copying files.");
  } catch (err) {
    throw new Error(`Error processing files: ${err.message}`, { cause: err });
  }

  console.log("Finished copying application files.");
}

async function restructureApplication(root) {
  console.log("Restructuring application files in ", root);
  const source = `${root}/en`;
  const destination = `${root}/`;

  try {
    const files = await fs.promises.readdir(source);
    // console.log("Files: ", files);

    for (const file of files) {
      console.log("Moving file: ", file);
      await fs.promises.rename(`${source}/${file}`, `${destination}/${file}`);
    }

    console.log("Finished moving files.");
  } catch (err) {
    throw new Error(`Error processing files: ${err.message}`, { cause: err });
  }

  console.log("Finished restructuring files.");
}

module.exports = async function (ctx) {
  // select the angular build result based on the build configuration
  const sourcePath = `./dist-${ctx.env.IONIC_CLI_HOOK_CTX_BUILD_CONFIGURATION}/browser`;
  const destinationPath = './capacitor-app';

  await copyApplicationFiles(sourcePath, destinationPath);

  await createIndexHtml(`${destinationPath}/index.html`);

  // await restructureApplication(destinationPath);
};
