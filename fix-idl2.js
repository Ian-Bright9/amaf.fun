import { readFileSync, writeFileSync } from 'fs';

const idl = JSON.parse(readFileSync('./rust/idl.json', 'utf8'));

// Move top-level "accounts" to "types" (Anchor 0.31.1 format)
if (idl.accounts && !idl.types) {
  idl.types = idl.accounts;
  delete idl.accounts;
  console.log('Moved accounts to types');
}

// If types is already empty array, replace with accounts content
if (idl.types && Array.isArray(idl.types) && idl.types.length === 0 && idl.accounts) {
  idl.types = idl.accounts;
  delete idl.accounts;
  console.log('Replaced empty types with accounts');
}

writeFileSync('./rust/idl.json', JSON.stringify(idl, null, 2), 'utf8');

console.log('Fixed rust/idl.json');
console.log('Has types:', !!idl.types);
console.log('Types length:', idl.types ? idl.types.length : 0);
