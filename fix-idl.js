import { readFileSync, writeFileSync } from 'fs';

const idl = JSON.parse(readFileSync('./rust/idl.json', 'utf8'));

idl.types = [];

writeFileSync('./rust/idl.json', JSON.stringify(idl, null, 2), 'utf8');

console.log('Added empty types array to rust/idl.json');
