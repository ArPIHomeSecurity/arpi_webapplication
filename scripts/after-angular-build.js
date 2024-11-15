// File needs to be CommonJs
const fs = require("fs");

const INDEX_HTML_PATH = "./dist-development/index.html";
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

module.exports = function () {
  console.log("creating index.html...");
  createIndexHtml();
};

function createIndexHtml() {
  fs.writeFile(INDEX_HTML_PATH, htmlContent, (error) => {
    if (error) {
      throw new Error(`Error writing file: ${INDEX_HTML_PATH}`, { cause: error });
    } else {
      console.log("Successfully created file:", INDEX_HTML_PATH);
    }
  });
}
