// Run with:  node make-list.js
// Scans the images/ folder (and subfolders) and writes photos.js.
const fs=require('fs'),path=require('path');
const re=/\.(jpe?g|png|gif|webp|avif|svg)$/i;
function walk(dir,rel){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>
    e.isDirectory()?walk(path.join(dir,e.name),rel+e.name+'/'):re.test(e.name)?[rel+e.name]:[]);
}
const root=path.join(__dirname,'images');
if(!fs.existsSync(root)){console.log('No images folder found next to this file.');process.exit(1)}
const list=walk(root,'images/');
fs.writeFileSync(path.join(__dirname,'photos.js'),'window.PHOTO_LIST='+JSON.stringify(list,null,2)+';\n');
console.log('Found '+list.length+' photos. Refresh the page.');
