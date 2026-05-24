const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('e:/New folder/wearshare-app/app');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    content = content.replace(/from ['"]@\/app\/api\/auth\/\[\.\.\.nextauth\]\/route['"]/g, 'from "@/lib/authOptions"');
    content = content.replace(/from ['"]\.\.\/auth\/\[\.\.\.nextauth\]\/route['"]/g, 'from "@/lib/authOptions"');
    content = content.replace(/from ['"]\.\.\/\.\.\/auth\/\[\.\.\.nextauth\]\/route['"]/g, 'from "@/lib/authOptions"');
    content = content.replace(/from ['"]\.\.\/api\/auth\/\[\.\.\.nextauth\]\/route['"]/g, 'from "@/lib/authOptions"');
    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Fixed', file);
    }
});
