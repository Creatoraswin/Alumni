const fs = require('fs');

const updates = {
  'src/app/page.tsx': {
    title: 'CUTMAP Alumni Network',
    desc: 'Stay connected with your batchmates, explore opportunities, and build your network at the CUTMAP Alumni portal.'
  },
  'src/app/SignUp/page.tsx': {
    title: 'Alumni Registration | CUTMAP',
    desc: 'Register to join the CUTMAP Alumni Network.'
  },
  'src/app/alumni-directory/page.tsx': {
    title: 'Alumni Directory | CUTMAP',
    desc: 'Browse the comprehensive directory of CUTMAP alumni, connect with professionals, and build your network.'
  },
  'src/app/alumni-spotlight/page.tsx': {
    title: 'Alumni Spotlight | CUTMAP',
    desc: 'Discover inspiring success stories and achievements of our notable CUTMAP alumni.'
  },
  'src/app/alumni-talks/page.tsx': {
    title: 'Alumni Talks | CUTMAP',
    desc: 'Watch and learn from insightful talks and presentations given by CUTMAP alumni.'
  },
  'src/app/alumni-meets/page.tsx': {
    title: 'Alumni Meets | CUTMAP',
    desc: 'Join upcoming alumni meets and connect with fellow graduates.'
  },
  'src/app/news/page.tsx': {
    title: 'Alumni News | CUTMAP',
    desc: 'Stay updated with the latest news, events, and announcements from the CUTMAP Alumni network.'
  }
};

for (const [file, meta] of Object.entries(updates)) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/['"`]use client['"`];?\r?\n/g, '');
    const metadataImport = "import { Metadata } from 'next';\n\n";
    const metadataExport = `export const metadata: Metadata = {\n  title: "${meta.title}",\n  description: "${meta.desc}",\n};\n\n`;
    content = metadataImport + metadataExport + content;
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  } else {
    console.log('File not found: ' + file);
  }
}
