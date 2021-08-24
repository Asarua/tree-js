#!/usr/bin/env node

const fs = require('fs').promises
const { resolve } = require('path')

const argv = process.argv.slice(2)
const HAS_SKIP = argv.indexOf('-I')

let SKIP = ''
let FILE_WRITER = ''

if (~HAS_SKIP) {
  SKIP = argv[HAS_SKIP + 1]
  argv.splice(HAS_SKIP, 2)
}

if (argv.length) {
  FILE_WRITER = argv[0]
}

const pathEnum = {}

async function pathGetter(path = process.cwd(), wrapper = pathEnum) {
  const dir = await fs.opendir(path)
  for await (const item of dir) {
    const name = item.name
    if (!SKIP.includes(name)) {
      if (item.isDirectory()) {
        if (name !== '.git') {
          const wrap = wrapper[name] = {}
          await pathGetter(resolve(path, name), wrap)
        }
      } else {
        wrapper[name] = 'done'
      }
    }
  }
  return
}

async function execPathGetter() {
  await pathGetter()
  if (FILE_WRITER) {
    fs.writeFile(FILE_WRITER, JSON.stringify(pathEnum, null, '\t'))
  } else {
    console.log(JSON.stringify(pathEnum))
  }
}

execPathGetter()
