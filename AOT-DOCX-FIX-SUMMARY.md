# AOT DOCX Generation - Fix Summary

## Problem
The AOT generation from DOCX templates was failing with the error: "Erreur lors de la génération de l'AOT"

## Root Causes Identified & Fixed

### 1. **No Default DOCX Gabarit Exists**
- **Issue**: Users couldn't download AOT as DOCX because no template was available
- **Fix**: Created `/api/gabarits/init-defaults` endpoint that automatically creates a default DOCX gabarit from the template file
- **Files Modified/Created**:
  - `app/api/gabarits/init-defaults/route.ts` (NEW)
  - `app/dashboard/gabarit/components/DocxUploader.tsx` (MODIFIED - calls init on load)
  - `app/dashboard/occupations/[id]/hooks/useOccupationLogic.ts` (MODIFIED - calls init when fetching gabarits)

### 2. **Poor Error Messages**
- **Issue**: The AOT generation endpoint didn't provide helpful error messages
- **Fix**: Enhanced `/api/aot-docx-generate/[id]/route.ts` with detailed error logging:
  - Lists available DOCX gabarits if none found
  - Shows file paths being searched
  - Logs XML replacement progress
  - Handles missing files gracefully

### 3. **DOCX Gabarit Management Issues**
- **Issue**: PATCH/DELETE endpoints didn't properly handle DOCX gabarits
- **Fix**: Updated `/api/gabarits/[id]/route.ts`:
  - PATCH now properly handles DOCX vs PDF gabarits (doesn't overwrite contenu for DOCX)
  - DELETE now removes the actual DOCX file from disk when deleting a gabarit

## How It Works Now

### Step 1: Auto-Initialization
When a user:
- Opens the AOT section of an occupation detail page, OR
- Visits the Templates DOCX uploader page

The system automatically:
1. Calls `/api/gabarits/init-defaults` 
2. Creates a default DOCX gabarit from `/public/templates/AOT-Template-Default.docx` if one doesn't exist
3. Loads all available DOCX gabarits from the database

### Step 2: Template Selection
Users can:
- View the list of available DOCX templates in the AOT preparation section
- Select a template from the dropdown (or use the default)
- The selected `aotGabaritId` is saved to the occupation

### Step 3: AOT Generation
When user clicks "Télécharger AOT (Word)":
1. API fetches the occupation and its selected AOT gabarit
2. Reads the DOCX template file from `/public/gabarits-docx/`
3. Extracts the document.xml from the DOCX (which is a ZIP archive)
4. Replaces variables with actual data:
   - `{id}`, `{nom}`, `{tiers.nom}`, `{demandeurComplet}`
   - `{adresse}`, `{dateDebut}`, `{dateFin}`
   - `{today}`, `{signataireNom}`, `{signataireRole}`, `{signataireDelegation}`
   - `{article1.designation}`, `{article1.quantite}`, `{article1.dates}`, etc.
5. Regenerates the DOCX with replaced variables
6. Returns the generated DOCX for download

## Files Modified/Created

### Created:
- **`app/api/gabarits/init-defaults/route.ts`**: Auto-initializes default DOCX gabarit
- **`C:\dev\ODP\public\templates\AOT-Template-Default.docx`**: Default DOCX template (already exists)

### Modified:
- **`app/api/aot-docx-generate/[id]/route.ts`**: Better error handling and logging
- **`app/api/gabarits/[id]/route.ts`**: Proper DOCX file handling in PATCH/DELETE
- **`app/dashboard/gabarit/components/DocxUploader.tsx`**: Auto-initialization on load
- **`app/dashboard/occupations/[id]/hooks/useOccupationLogic.ts`**: Auto-initialization when fetching gabarits

## Testing Instructions

### Quick Test:
1. **Clear the database** (or use a fresh occupation):
   - Delete all gabarits from the database if you want a clean start
   - Or just create a new occupation

2. **Test Auto-Initialization**:
   - Go to `/dashboard/occupations/[id]` for a CHANTIER in PREP status
   - The system should automatically create the default DOCX gabarit
   - You should see "AOT - Template par défaut" in the dropdown
   - OR go to `/dashboard/gabarit` and open the "Templates DOCX" tab

3. **Test AOT Generation**:
   - Select the default template from the dropdown in the AOT section
   - Click "Télécharger AOT (Word)"
   - A DOCX file should download successfully

4. **Test Custom Templates**:
   - Go to `/dashboard/gabarit` 
   - Click on "Templates DOCX" tab
   - Click "Uploader DOCX" button
   - Select a Word document with variable placeholders
   - The template should appear in the list

### Debugging:
If you encounter errors, check:
1. **Browser Console**: F12 > Console tab for client-side errors
2. **Server Logs**: Look for lines starting with `[AOT DOCX]` or `[GABARITS INIT]`
3. **File System**: 
   - Default template should exist at: `C:\dev\ODP\public\templates\AOT-Template-Default.docx`
   - Uploaded templates should be at: `C:\dev\ODP\public\gabarits-docx/`

## Variable Reference for DOCX Templates

Insert these variables in your Word document DOCX templates:

### Dossier Variables
- `{id}` - Occupation ID
- `{nom}` - Occupation name
- `{adresse}` - Occupation address
- `{dateDebut}` - Start date (formatted DD/MM/YYYY)
- `{dateFin}` - End date (formatted DD/MM/YYYY)

### Tiers Variables  
- `{tiers.nom}` - Third party name
- `{demandeurComplet}` - Full demander text with legal nature
- `{agissantPour}` - Acting for (if applicable)

### Signataire Variables
- `{signataireNom}` - Signatory name
- `{signataireRole}` - Signatory role
- `{signataireDelegation}` - Delegation text
- `{today}` - Current date (formatted DD/MM/YYYY)

### Article Variables (for each line item)
- `{article1.designation}` - Article designation
- `{article1.quantite}` - Quantity
- `{article1.pu}` - Unit price
- `{article1.note}` - Notes
- `{article1.dates}` - Date range (DD/MM/YYYY - DD/MM/YYYY)
- `{article1.details}` - Details with unit name
- `{article2.designation}`, `{article2.quantite}`, etc.

## Known Limitations

1. Variables are case-sensitive
2. If a variable is split across XML tags in the DOCX, it might not be replaced (Word sometimes inserts formatting tags mid-variable)
3. Images in templates are preserved but not modified
4. Headers/footers need manual updates (they're in separate XML files)

## Next Steps for User

1. **Verify the fixes work** by testing the steps above
2. **Upload custom templates** if needed via the Templates DOCX uploader
3. **Create a better default template** by modifying the Word file at `/public/templates/AOT-Template-Default.docx`
   - Add your organisation's branding
   - Add all necessary legal language
   - Add any missing variables
4. **Report any issues** with specific error messages from the console or server logs
