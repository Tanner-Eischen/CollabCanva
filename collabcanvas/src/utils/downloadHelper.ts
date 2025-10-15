/**
 * Download Helper Utilities
 * Functions for triggering file downloads in the browser
 */

/**
 * Download data as JSON file
 * Creates a blob and triggers browser download
 * 
 * @param data Data to download (will be JSON.stringify'd)
 * @param filename Filename for download
 */
export function downloadJSON(data: any, filename: string): void {
  try {
    // Convert to JSON string with pretty formatting
    const jsonString = JSON.stringify(data, null, 2)
    
    // Create blob
    const blob = new Blob([jsonString], {
      type: 'application/json',
    })
    
    // Create download URL
    const url = URL.createObjectURL(blob)
    
    // Create temporary link element
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    
    // Trigger download
    document.body.appendChild(a)
    a.click()
    
    // Cleanup
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download JSON:', error)
    throw error
  }
}

/**
 * Download text content as file
 * 
 * @param content Text content to download
 * @param filename Filename for download
 * @param mimeType MIME type (default: text/plain)
 */
export function downloadText(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  try {
    // Create blob
    const blob = new Blob([content], { type: mimeType })
    
    // Create download URL
    const url = URL.createObjectURL(blob)
    
    // Create temporary link element
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    
    // Trigger download
    document.body.appendChild(a)
    a.click()
    
    // Cleanup
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download text:', error)
    throw error
  }
}

/**
 * Trigger file picker for upload
 * Returns a promise that resolves with the selected file
 * 
 * @param accept File types to accept (e.g., '.json')
 * @returns Promise that resolves with selected File or null
 */
export function selectFile(accept: string = '*'): Promise<File | null> {
  return new Promise((resolve) => {
    // Create input element
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    
    // Handle file selection
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0] || null
      resolve(file)
      
      // Cleanup
      document.body.removeChild(input)
    }
    
    // Handle cancel
    input.oncancel = () => {
      resolve(null)
      document.body.removeChild(input)
    }
    
    // Trigger file picker
    document.body.appendChild(input)
    input.click()
  })
}

