const fs = require('fs');
const path = 'c:/dev/ODP/app/dashboard/occupations/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Use a more specific and robust approach
// We look for the clock div and wrap it or modify after it.

// Replacement 1: The planned date line
const plannedDateRegex = /:\s*`Du \${format\(new Date\(ligne\.dateDebut\), 'dd\/MM\/yyyy'\)} au \${format\(new Date\(ligne\.dateFin\), 'dd\/MM\/yyyy'\)}`/g;
const plannedDateReplacement = `: \`Prévu : Du \${(() => { try { return ligne.dateDebut ? format(new Date(ligne.dateDebut), 'dd/MM/yyyy') : '?'; } catch(e) { return '?'; } })()} au \${(() => { try { return ligne.dateFin ? format(new Date(ligne.dateFin), 'dd/MM/yyyy') : '?'; } catch(e) { return '?'; } })()}\``;

content = content.replace(plannedDateRegex, plannedDateReplacement);

// Replacement 2 & 3: Wrapping in flex-col and adding Constaté block
const clockSectionRegex = /<div className="flex items-center gap-3 text-slate-500">\s*<div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">\s*<Clock size=\{14\} \/>\s*<\/div>/;

content = content.replace(clockSectionRegex, (match) => {
  return `<div className="flex flex-col gap-1">\n                                <div className="flex items-center gap-3 text-slate-500">\n                                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">\n                                    <Clock size={14} />\n                                  </div>`;
});

// We need to close the wrap and add the constaté div. 
// We look for the closing span of the date and the following div.
const afterDateRegex = /<\/span>\s*<\/div>\s*<div className="flex items-center gap-3 text-slate-500">\s*<div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">\s*<Hash size=\{14\} \/>/;

content = content.replace(afterDateRegex, (match) => {
  return `</span>\n                                </div>\n                                {ligne.dateDebutConstatee && (\n                                  <div className="flex items-center gap-2 ml-1">\n                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/50">\n                                      Constaté : Du {(() => {\n                                          try { return format(new Date(ligne.dateDebutConstatee), 'dd/MM/yyyy'); } catch(e) { return '?'; }\n                                        })()} au {(() => {\n                                          try { return format(new Date(ligne.dateFinConstatee), 'dd/MM/yyyy'); } catch(e) { return '?'; }\n                                        })()}\n                                    </span>\n                                  </div>\n                                )}\n                              </div>\n\n                              <div className="flex items-center gap-3 text-slate-500">\n                                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">\n                                  <Hash size={14} />`;
});

fs.writeFileSync(path, content);
console.log("ODP File Updated Successfully with Obs Dates.");
