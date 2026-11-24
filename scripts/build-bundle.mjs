import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const srcDir = path.join(rootDir, 'src')
const stageDir = path.join(rootDir, 'public', '_')
const buildDir = path.join(rootDir, 'build')
const bundleZip = path.join(buildDir, 'ui-bundle.zip')

function ensureDir (dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function copyDirRecursive (from, to) {
  if (!fs.existsSync(from)) return
  ensureDir(to)
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name)
    const destPath = path.join(to, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else if (!entry.name.endsWith('~')) {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function resolveCssImports (entryFile, seen = new Set()) {
  const abs = path.resolve(entryFile)
  if (seen.has(abs)) return ''
  seen.add(abs)
  const dir = path.dirname(abs)
  const content = fs.readFileSync(abs, 'utf8')
  const banner = `/* === ${path.relative(srcDir, abs)} === */\n`
  const resolved = content.replace(
    /^\s*@import\s+["']([^"']+)["']\s*;\s*$/gm,
    (_, importPath) => {
      const target = path.resolve(dir, importPath)
      if (!fs.existsSync(target)) {
        throw new Error(`CSS import not found: ${importPath} (from ${abs})`)
      }
      return resolveCssImports(target, seen)
    }
  )
  return banner + resolved + '\n'
}

function buildCss () {
  const cssDestDir = path.join(stageDir, 'css')
  ensureDir(cssDestDir)
  const siteCss = resolveCssImports(path.join(srcDir, 'css', 'site.css'))
  fs.writeFileSync(path.join(cssDestDir, 'site.css'), siteCss, 'utf8')

  const vendorCssDir = path.join(srcDir, 'css', 'vendor')
  if (fs.existsSync(vendorCssDir)) {
    copyDirRecursive(vendorCssDir, path.join(cssDestDir, 'vendor'))
  }
}

function buildJs () {
  const jsDestDir = path.join(stageDir, 'js')
  const vendorDestDir = path.join(jsDestDir, 'vendor')
  ensureDir(vendorDestDir)

  // Concatenate ordered site scripts (01-*.js .. 09-*.js)
  const jsSrcDir = path.join(srcDir, 'js')
  const orderedFiles = fs
    .readdirSync(jsSrcDir)
    .filter((name) => /^[0-9]{2}-.*\.js$/.test(name))
    .sort()

  const combinedJs = orderedFiles
    .map((name) => {
      const filePath = path.join(jsSrcDir, name)
      return `/* === ${name} === */\n${fs.readFileSync(filePath, 'utf8')}\n`
    })
    .join('\n')

  fs.writeFileSync(path.join(jsDestDir, 'site.js'), combinedJs, 'utf8')

  // Vendor scripts
  const vendorSrcDir = path.join(jsSrcDir, 'vendor')
  const terraformSrc = path.join(vendorSrcDir, 'terraform.js')
  if (fs.existsSync(terraformSrc)) {
    fs.copyFileSync(terraformSrc, path.join(vendorDestDir, 'terraform.js'))
  }

  const highlightBundleSrc = path.join(vendorSrcDir, 'highlight.bundle.js')
  const highlightOut = path.join(vendorDestDir, 'highlight.js')
  const esbuildBin = path.join(rootDir, 'node_modules', '.bin', 'esbuild')

  if (fs.existsSync(esbuildBin) && fs.existsSync(highlightBundleSrc)) {
    execFileSync(
      esbuildBin,
      [
        highlightBundleSrc,
        '--bundle',
        '--minify',
        '--platform=browser',
        '--target=es2019',
        `--outfile=${highlightOut}`,
      ],
      { stdio: 'inherit' }
    )
  } else if (fs.existsSync(highlightBundleSrc)) {
    // Offline fallback when node_modules is not installed locally
    const fallback = `/* highlight.js runtime placeholder - run npm ci && npm run bundle in CI for full hljs bundle */\n`
    fs.writeFileSync(highlightOut, fallback, 'utf8')
  }
}

function copyAssets () {
  for (const folder of ['helpers', 'layouts', 'partials', 'img', 'font']) {
    copyDirRecursive(path.join(srcDir, folder), path.join(stageDir, folder))
  }
  const uiYml = path.join(srcDir, 'ui.yml')
  if (fs.existsSync(uiYml)) {
    fs.copyFileSync(uiYml, path.join(stageDir, 'ui.yml'))
  }
  const staticDir = path.join(srcDir, 'static')
  if (fs.existsSync(staticDir)) {
    copyDirRecursive(staticDir, stageDir)
  }
}

function packBundle () {
  ensureDir(buildDir)
  if (fs.existsSync(bundleZip)) fs.rmSync(bundleZip)
  execFileSync('zip', ['-r', '-q', bundleZip, '.'], { cwd: stageDir, stdio: 'inherit' })
}

function main () {
  const mode = process.argv[2] || 'bundle'
  if (mode === 'clean') {
    fs.rmSync(path.join(rootDir, 'public'), { recursive: true, force: true })
    fs.rmSync(buildDir, { recursive: true, force: true })
    console.log('Cleaned public/ and build/')
    return
  }

  fs.rmSync(stageDir, { recursive: true, force: true })
  ensureDir(stageDir)

  buildCss()
  buildJs()
  copyAssets()

  if (mode === 'bundle') {
    packBundle()
    const stats = fs.statSync(bundleZip)
    console.log(`Built Antora UI bundle: ${bundleZip} (${(stats.size / 1024).toFixed(1)} KiB)`)
  } else {
    console.log(`Built Antora UI assets in: ${stageDir}`)
  }
}

main()
