# PWA Icons TODO

## Generate PNG Icons from SVG

The PWA configuration is complete, but you need to generate the actual PNG icon files.

### Steps:

1. Open `public/icon.svg` in a browser or image editor (Figma, Sketch, Photoshop, etc.)

2. Export/Save the icon as PNG at these sizes:
   - `icon-192x192.png` (192x192 pixels)
   - `icon-512x512.png` (512x512 pixels)

3. Place the PNG files in the `public/` directory

### Alternative: Use online converter

Visit https://www.aconvert.com/image/svg-to-png/ or similar service:
- Upload `public/icon.svg`
- Set width/height to 192x192, convert, download as `icon-192x192.png`
- Repeat for 512x512, download as `icon-512x512.png`
- Place both files in `public/` directory

### Quick Command Line (if you have ImageMagick installed):

```bash
convert public/icon.svg -resize 192x192 public/icon-192x192.png
convert public/icon.svg -resize 512x512 public/icon-512x512.png
```

Once the PNG files are generated, the PWA installation will work properly with proper icons.
