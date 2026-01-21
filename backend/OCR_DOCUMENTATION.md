# Receipt OCR Documentation

## Overview

The Receipt OCR feature uses Tesseract.js to automatically extract items, prices, and totals from receipt images. This feature enables users to quickly split bills by uploading a photo instead of manually entering data.

## Features

- **Automatic Text Extraction**: Uses Tesseract.js OCR engine
- **Image Preprocessing**: Automatic rotation, enhancement, and optimization
- **Structured Data Extraction**: Identifies items, quantities, prices, and totals
- **Confidence Scoring**: Provides confidence metrics for accuracy assessment
- **Error Handling**: Graceful fallback and detailed error messages
- **Multiple Format Support**: JPEG, PNG, GIF, WebP, TIFF

## API Endpoint

### POST `/api/receipts/scan`

Scan a receipt image to extract items and prices.

**Request:**
```
Content-Type: multipart/form-data
Body: { image: File }
```

**Response:**
```json
{
  "items": [
    {
      "name": "Espresso",
      "quantity": 1,
      "price": 3.50,
      "confidence": 85
    },
    {
      "name": "Croissant",
      "quantity": 1,
      "price": 4.25,
      "confidence": 80
    }
  ],
  "subtotal": 7.75,
  "tax": 0.62,
  "tip": null,
  "total": 8.37,
  "confidence": 82,
  "rawText": "COFFEE SHOP...[full extracted text]"
}
```

## Usage Examples

### cURL

```bash
curl -X POST http://localhost:3000/api/receipts/scan \
  -F "image=@/path/to/receipt.jpg"
```

### JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/receipts/scan', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log(data.items); // Array of extracted items
console.log(data.total); // Total amount
```

### Python/Requests

```python
import requests

with open('receipt.jpg', 'rb') as f:
    files = {'image': f}
    response = requests.post(
        'http://localhost:3000/api/receipts/scan',
        files=files
    )
    
result = response.json()
print(result['items'])
print(result['total'])
```

## Supported Receipt Formats

The system can process receipts in the following formats:

| Format | File Type | Notes |
|--------|-----------|-------|
| JPEG | `.jpg`, `.jpeg` | Most common format, good compression |
| PNG | `.png` | Lossless format, larger file size |
| GIF | `.gif` | Animated not required |
| WebP | `.webp` | Modern format, excellent compression |
| TIFF | `.tiff` | High quality, large file size |

### File Size Limits

- **Maximum Size**: 10MB per image
- **Recommended Size**: 1-5MB for optimal performance

### Image Quality Guidelines

For best OCR results:

1. **Resolution**: 300 DPI or higher (for printed receipts)
2. **Lighting**: Well-lit, no shadows or glare
3. **Angle**: Photograph straight on, not at an angle
4. **Focus**: Sharp focus on receipt text
5. **Cropping**: Include entire receipt with margins

## Data Extraction Details

### Item Extraction

The parser identifies items by:

1. **Line-based Detection**: Looks for lines with prices
2. **Price Patterns**: Matches currency symbols and amounts
3. **Item Names**: Extracts text before the price
4. **Quantities**: Identifies quantity indicators (2x, qty: 2, etc.)

### Price Extraction

Supported price formats:

```
$12.99
12.99
$12
12
12,99 (European format)
```

### Total Extraction

Recognizes variations of:

```
Total
Amount Due
Grand Total
Balance Due
```

### Tax Extraction

Recognizes:

```
Tax
Sales Tax
Tax Amount
VAT
State Tax
```

### Tip Extraction

Recognizes:

```
Tip
Gratuity
Additional
Gratuity Amount
```

## Confidence Scores

Each extraction includes a confidence score (0-100):

- **90-100**: High confidence, minimal manual review needed
- **70-89**: Good confidence, review recommended
- **50-69**: Moderate confidence, manual verification suggested
- **Below 50**: Low confidence, manual entry recommended

## Error Handling

The API provides detailed error messages:

### Invalid File Type
```json
{
  "statusCode": 400,
  "message": "Invalid file type. Allowed types: image/jpeg, image/png, image/gif, image/webp, image/tiff",
  "error": "Bad Request"
}
```

### File Too Large
```json
{
  "statusCode": 413,
  "message": "File size exceeds maximum limit of 10MB",
  "error": "Payload Too Large"
}
```

### OCR Processing Failed
```json
{
  "statusCode": 500,
  "message": "Failed to process receipt: Unable to extract text from image",
  "error": "Internal Server Error"
}
```

### No Text Extracted
```json
{
  "statusCode": 400,
  "message": "No text could be extracted from the receipt image",
  "error": "Bad Request"
}
```

## Technical Implementation

### Image Preprocessing

The system automatically:

1. **Rotates**: Corrects orientation based on EXIF data
2. **Enhances**: Sharpens and normalizes image
3. **Resizes**: Optimizes for OCR (max 2000x2000)
4. **Converts**: Changes to grayscale for better text detection

### OCR Engine

- **Engine**: Tesseract.js (JavaScript binding of Tesseract)
- **Language**: English (eng)
- **Worker Threads**: 1 (configurable)

### Parsing Strategy

1. **Line Detection**: Identifies receipt lines with prices
2. **Regex Matching**: Extracts prices using patterns
3. **Text Cleanup**: Removes special characters and normalizes
4. **Duplicate Merging**: Combines identical items
5. **Validation**: Ensures data integrity

## Performance Considerations

### Processing Time

- **Typical**: 2-5 seconds per image
- **Complex receipts**: Up to 10 seconds
- **Depends on**: Image size, quality, and OCR complexity

### Memory Usage

- **Per request**: ~50-100MB
- **Tesseract worker**: ~30-50MB persistent

### Optimization Tips

1. Upload properly cropped images (receipt only, not full photo)
2. Use JPEG format for faster processing
3. Ensure good lighting and focus
4. Keep file size under 5MB

## Fallback Options

If OCR fails or confidence is low:

1. **Retry**: Automatic retry up to 3 times
2. **Manual Entry**: User can manually enter items
3. **Partial Results**: Return whatever could be extracted
4. **Error Details**: Provide raw extracted text for manual correction

## Integration with Bill Splitting

Once a receipt is scanned:

1. User reviews extracted items
2. User can edit items or quantities
3. User specifies who is sharing
4. Bill split is calculated
5. Split is settled

## Best Practices

### For Users

1. **Photograph Quality**: Take clear, straight-on photos
2. **Lighting**: Use good lighting without glare
3. **Composition**: Include entire receipt with margins
4. **Focus**: Ensure receipt text is sharp
5. **File Size**: Upload optimized images

### For Developers

1. **Error Handling**: Always check confidence scores
2. **Validation**: Validate extracted data before saving
3. **Fallback**: Provide manual entry option
4. **User Feedback**: Show confidence and allow corrections
5. **Testing**: Test with various receipt types

## Troubleshooting

### "No text could be extracted"

**Causes:**
- Image is too blurry
- Poor lighting or glare
- Receipt is printed faintly
- Image is at an angle

**Solutions:**
- Retake photo with better lighting
- Ensure sharp focus
- Increase brightness if printed receipt is faint
- Photograph straight-on

### Low Confidence Score

**Causes:**
- Poor image quality
- Handwritten items
- Receipt format not standard
- OCR engine uncertainty

**Solutions:**
- Retake photo with higher quality
- Manually review and correct items
- Try different lighting angles
- Review raw text for corrections

### Missing Items or Prices

**Causes:**
- OCR engine missed some lines
- Faint or small text
- Complex formatting

**Solutions:**
- Review raw extracted text
- Manually add missing items
- Retake clearer photo
- Contact support for unusual formats

## Configuration

### Environment Variables

```env
# Image processing
OCR_MAX_WIDTH=2000
OCR_MAX_HEIGHT=2000
OCR_ENHANCE=true
OCR_ROTATE=true

# File uploads
UPLOAD_MAX_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=./uploads

# OCR engine
OCR_LANGUAGE=eng
OCR_WORKER_THREADS=1
```

### Customization

To adjust OCR behavior, modify `backend/src/ocr/ocr.service.ts`:

```typescript
// Configure preprocessing options
const ocrResult = await this.ocrService.extractText(filePath, {
  rotate: true,
  enhance: true,
  maxWidth: 2000,
  maxHeight: 2000,
});

// Adjust confidence threshold
const minConfidence = 70; // Minimum acceptable confidence
```

## Future Enhancements

Planned improvements:

1. **Multi-language Support**: Spanish, French, German, etc.
2. **Handwriting Recognition**: Support handwritten receipts
3. **Receipt Database**: Learn from previous receipts
4. **AI Enhancement**: Machine learning for better parsing
5. **Real-time Preview**: Show extraction as user photographs
6. **Duplicate Detection**: Identify and merge duplicate items automatically

## Support

For issues or questions:

1. **Check Logs**: Review backend logs for error details
2. **Test Image**: Try with a different receipt photo
3. **Manual Fallback**: Use manual entry if OCR fails
4. **Report Issues**: Submit bug reports with sample receipts
