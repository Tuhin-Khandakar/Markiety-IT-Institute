const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('-bn.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace tooltips
    content = content.replace(/title="Toggle theme"/g, 'title="থিম পরিবর্তন করুন"');
    content = content.replace(/title="Toggle language"/g, 'title="ভাষা পরিবর্তন করুন"');
    
    // Replace address
    content = content.replace(/Markiety IT Institute \(MIT\)/g, 'মার্কিটি আইটি ইনস্টিটিউট (এমআইটি)');
    content = content.replace(/Nodi Bangla Manik Palace, 2nd Floor, 39 No Shop/g, 'নদী বাংলা মানিক প্যালেস, ২য় তলা, ৩৯ নং শপ');
    content = content.replace(/Madhabdi, Narsingdi, Bangladesh/g, 'মাধবদী, নরসিংদী - ১৬০৪, বাংলাদেশ');
    content = content.replace(/Madhabdi, Narsingdi - 1604, Bangladesh/g, 'মাধবদী, নরসিংদী - ১৬০৪, বাংলাদেশ');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
});
