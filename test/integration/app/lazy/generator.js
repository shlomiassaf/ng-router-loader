const shell = require('child_process').execSync;
const fs = require('fs');
const path = require('path');

for (var i = 1001; i<2001; i++) {
  shell('cp -r ngLazy ngLazy' + i, {
    cwd: __dirname,
    stdio: 'inherit'
  })

  var source = fs.readFileSync(path.join(__dirname, 'ngLazy' + i, 'detail.component.ts'), 'utf8');
  source = source.replace(/__DETAIL__/g, 'Detail' + i).replace(`selector: 'detail'`, `selector: 'detail${i}'`);

  fs.writeFileSync(path.join(__dirname, 'ngLazy' + i, 'detail.component.ts'), source);

  console.log(`{ path: 'lazy${i}', loadChildren: './lazy/ngLazy${i}#LazyModule?loader=sync'},`)
}

