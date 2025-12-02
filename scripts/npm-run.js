#!/usr/bin/env node
// Wrapper script to make wsrun work with npm
const {spawn} = require('child_process');
const args = process.argv.slice(2);
const child = spawn('npm', ['run', ...args], {stdio: 'inherit'});
child.on('exit', code => process.exit(code));
