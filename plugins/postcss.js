// Forked from https://github.com/deanc/esbuild-plugin-postcss/blob/main/index.js to allow .sass extensions
const fs = require("fs-extra");
const postcss = require("postcss");
const util = require("util");
const tmp = require("tmp");
const path = require("path");

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const ensureDir = util.promisify(fs.ensureDir);

module.exports = (options = { plugins: [] }) => ({
  name: "postcss",
  setup: function (build) {
    const { rootDir = options.rootDir || process.cwd() } = options;
    const tmpDirPath = tmp.dirSync().name;
    build.onResolve(
      // Fix regexp to allow sass
      { filter: /.\.((sa|c)ss)$/, namespace: "file" },
      async (args) => {
        const sourceFullPath = path.resolve(args.resolveDir, args.path);
        const sourceExt = path.extname(sourceFullPath);
        const sourceBaseName = path.basename(sourceFullPath, sourceExt);
        const sourceDir = path.dirname(sourceFullPath);
        const sourceRelDir = path.relative(path.dirname(rootDir), sourceDir);

        const tmpDir = path.resolve(tmpDirPath, sourceRelDir);
        const tmpFilePath = path.resolve(tmpDir, `${sourceBaseName}.css`);
        await ensureDir(tmpDir);

        const css = await readFile(sourceFullPath);

        const result = postcss(options.plugins).process(css, {
          from: sourceFullPath,
          to: tmpFilePath
        });

        // Write result file
        await writeFile(tmpFilePath, result.css);

        return {
          path: tmpFilePath
        };
      }
    );
  }
});
