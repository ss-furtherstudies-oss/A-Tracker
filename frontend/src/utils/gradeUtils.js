/**
 * Grade utility functions extracted from StudentsGrid.jsx and StudentContext.jsx.
 * Centralizes all grade summary/display logic in one place.
 */

/**
 * Generate a compact summary string from an array of grade objects.
 * e.g. [{grade:'A*'},{grade:'A'},{grade:'A'}] → "1A*, 2A"
 */
export const generateSummary = (gradesArr) => {
  if (!gradesArr || gradesArr.length === 0) return '-';
  const counts = {};
  gradesArr.forEach(item => {
    const g = item.grade?.toUpperCase().trim();
    if (g && g !== 'NR') counts[g] = (counts[g] || 0) + 1;
  });
  if (Object.keys(counts).length === 0) return '-';

  return Object.keys(counts).sort((a, b) => {
    const aIsNum = !isNaN(a) && a.trim() !== '';
    const bIsNum = !isNaN(b) && b.trim() !== '';
    if (aIsNum && bIsNum) return Number(b) - Number(a);
    if (!aIsNum && bIsNum) return -1;
    if (aIsNum && !bIsNum) return 1;
    if (a === 'A*') return -1;
    if (b === 'A*') return 1;
    return a.localeCompare(b);
  }).map(g => {
    const isNum = !isNaN(g) && g.trim() !== '';
    return isNum ? `${counts[g]}x${g}` : `${counts[g]}${g}`;
  }).join(', ');
};
