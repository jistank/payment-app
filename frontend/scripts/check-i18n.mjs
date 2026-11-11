import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_LANGUAGE, LANGUAGES } from '../src/i18n/languages.js'
import { NAMESPACES } from '../src/i18n/namespaces.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const localesDir = path.join(projectRoot, 'src/i18n/locales')

function flatten(object, prefix = '') {
  return Object.entries(object).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    return value && typeof value === 'object' && !Array.isArray(value)
      ? flatten(value, fullKey)
      : [fullKey]
  })
}

function readNamespace(language, namespace) {
  const file = path.join(localesDir, language, `${namespace}.json`)
  return flatten(JSON.parse(readFileSync(file, 'utf8')))
}

const reference = Object.fromEntries(
  NAMESPACES.map((namespace) => [namespace, new Set(readNamespace(DEFAULT_LANGUAGE, namespace))]),
)

let errorCount = 0

for (const language of LANGUAGES) {
  if (!language.available) continue

  for (const namespace of NAMESPACES) {
    const keys = new Set(readNamespace(language.code, namespace))
    const missing = [...reference[namespace]].filter((key) => !keys.has(key))
    const extra = [...keys].filter((key) => !reference[namespace].has(key))

    if (missing.length > 0 || extra.length > 0) {
      errorCount += missing.length + extra.length
      console.error(`\n${language.code}/${namespace}.json`)

      if (missing.length > 0) console.error('  missing:', missing.join(', '))
      if (extra.length > 0) console.error('  extra:  ', extra.join(', '))
    }
  }
}

if (errorCount > 0) {
  console.error(`\ni18n check failed with ${errorCount} key mismatch(es).`)
  process.exit(1)
}

console.log(`i18n check passed: ${NAMESPACES.length} namespaces across available languages.`)
