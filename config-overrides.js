const path = require("path");
const WriteFilePlugin = require("write-file-webpack-plugin");
const fs = require("fs-extra");

module.exports = function override(config, env) {
  let buildPath = "./build";

  // Add entry for content-script
  const defaultEntryArray = config.entry;
  const resolvedContentPath = defaultEntryArray[
    defaultEntryArray.length - 1
  ].replace("index.tsx", "content.tsx");
  config.entry = {
    // Cut out the middle item in the entry array (the hot reloading script)
    // so we can use webpack dev server with the popup :D
    main: [
      ...defaultEntryArray.slice(0, 1),
      defaultEntryArray[defaultEntryArray.length - 1]
    ],
    content: [...defaultEntryArray.slice(0, 1), resolvedContentPath]
  };
  console.log(config.entry);

  config.devServer = {
    ...config.devServer,
    hot: false,
    inline: false
  };

  config.output.path = path.join(__dirname, buildPath);
  config.output.filename = "static/js/[name].bundle.js";
  config.plugins.push(new WriteFilePlugin());
  fs.removeSync(buildPath);
  fs.copySync("./public/", buildPath);

  return config;
};
