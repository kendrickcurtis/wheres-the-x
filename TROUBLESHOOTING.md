# Troubleshooting Notes for Where's The X Project

## Common Import/Export Issues

### TypeScript Interface Imports
**Problem**: `Uncaught SyntaxError: The requested module doesn't provide an export named: 'Location'`

**Root Cause**: When importing TypeScript interfaces/types, you MUST use `import type` instead of regular `import` when `verbatimModuleSyntax: true` is set in tsconfig.

**Solution**: 
```typescript
// ❌ Wrong - causes runtime error
import { Location } from './PuzzleEngine';

// ✅ Correct - works properly
import type { Location } from './PuzzleEngine';
```

**Files affected**: Any file importing interfaces from PuzzleEngine.ts (Location, City, Clue)

### Default vs Named Exports
**Problem**: `No matching export in "src/CluePanel.tsx" for import "CluePanel"`

**Root Cause**: Mismatch between how components are exported vs imported.

**Solutions**:
- CluePanel: `export default CluePanel` → `import CluePanel from './CluePanel'`
- ImageModal: `export const ImageModal` → `import { ImageModal } from './components/ImageModal'`

### TypeScript Compilation Errors
**Problem**: Module exports not available due to compilation errors

**Common fixes**:
1. Add `esModuleInterop: true` to tsconfig.app.json for seedrandom imports
2. Add missing types to interfaces (e.g., 'climate' | 'geography' to Clue type)
3. Ensure `resolveJsonModule: true` for JSON imports

## Layout Issues

### Clue Panel Height Problems
**Problem**: Submit button sliding around, clue panels inconsistent heights

**Solution**: Use fixed-height layout system:
- Total panel: 320px
- Header section: 60px (title, dots, location name)
- Clue section: 180px (all clue boxes: 120px height)
- Navigation/submit section: 60px (buttons)

### Image Clue Overflow
**Problem**: Images causing clue panels to be too tall

**Solution**: Set explicit height constraints on images:
```css
height: '120px',
maxHeight: '120px',
objectFit: 'cover',
display: 'block',
margin: '0',
padding: '0'
```

## Data Issues

### Missing Geography Clues
**Problem**: Geography clues not appearing

**Root Cause**: PuzzleEngine importing from `cities.json` instead of `enhanced-cities.json`

**Solution**: Update import in PuzzleEngine.ts:
```typescript
import citiesData from './data/enhanced-cities.json';
```

### Clue Generation Issues
**Problem**: Missing clues, duplicate clue types

**Solutions**:
1. Add `canGenerate()` checks to clue generation filtering
2. Reset `usedFinalDestinationClueTypes` for each new puzzle
3. Map constructor names to clue types correctly in filtering logic

## Quick Fixes Checklist

When encountering import/export errors:
1. ✅ Check if interface imports use `import type`
2. ✅ Verify default vs named export consistency
3. ✅ Run `npx tsc --noEmit` to check for compilation errors
4. ✅ Restart dev server if module cache issues persist
5. ✅ Check tsconfig.app.json for missing compiler options

When encountering layout issues:
1. ✅ Use fixed heights instead of min/max heights
2. ✅ Set explicit image dimensions
3. ✅ Use `overflow: hidden` on containers
4. ✅ Ensure consistent styling between single/multiple clue displays
