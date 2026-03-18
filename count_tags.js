const fs = require('fs');
const content = fs.readFileSync('c:\\dev\\ODP\\app\\dashboard\\gabarit\\page.tsx', 'utf8');

const tags = ['aside', 'main', 'div', 'button', 'h2', 'h3', 'h4', 'span', 'label', 'select', 'option', 'textarea', 'input', 'Link', 'plus', 'Save', 'Trash2', 'Move', 'Type', 'Square', 'ImageIcon', 'Database', 'ChevronLeft', 'Loader2', 'Maximize', 'Layers', 'Settings2', 'Copy', 'LayoutDashboard', 'Upload', 'Download', 'ChevronDown', 'ArrowUp', 'ArrowDown', 'AlignLeft', 'AlignCenter', 'AlignRight', 'ChevronUp', 'AlignHorizontalDistributeCenter', 'AlignVerticalDistributeCenter', 'AlignVerticalJustifyStart', 'AlignVerticalJustifyEnd'];

tags.forEach(t => {
   let open = (content.match(new RegExp('<' + t + '(\\s|>)', 'g')) || []).length;
   let close = (content.match(new RegExp('</' + t + '>', 'g')) || []).length;
   if (open !== close) {
      console.log(`Tag ${t}: ${open} open, ${close} close`);
   }
});
