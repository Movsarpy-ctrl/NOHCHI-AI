
export const downloadFile = (content: string | object, filename: string, type: 'txt' | 'json' | 'doc') => {
  let mime = 'text/plain';
  let data = '';

  if (type === 'json') {
    mime = 'application/json';
    data = JSON.stringify(content, null, 2);
  } else if (type === 'doc') {
    // Basic HTML wrapper for Word compatibility
    mime = 'application/msword';
    let bodyContent = '';
    
    if (typeof content === 'string') {
        // Convert newlines to breaks for HTML/Doc
        bodyContent = `<pre style="font-family: Arial; white-space: pre-wrap;">${content}</pre>`;
    } else {
        // If content is script array (object), format it as a table
        // We assume specific structure for ScriptLine[]
        const script = content as any[]; 
        if (Array.isArray(script)) {
            const rows = script.map(line => `
                <tr>
                    <td style="border:1px solid #ddd; padding:8px;">${line.time_range}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${line.visual}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${line.audio}</td>
                </tr>
            `).join('');
            
            bodyContent = `
                <table style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border:1px solid #ddd; padding:12px; text-align:left;">Тайминг</th>
                            <th style="border:1px solid #ddd; padding:12px; text-align:left;">Визуал</th>
                            <th style="border:1px solid #ddd; padding:12px; text-align:left;">Аудио</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        } else {
             data = JSON.stringify(content);
        }
    }
    
    if (!data) { // If not JSON logic
        data = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Export</title></head>
            <body>${bodyContent}</body>
            </html>
        `;
    }

  } else {
    // TXT
    if (typeof content === 'object') {
        // Format ScriptLine[] nicely for TXT
        if (Array.isArray(content)) {
            data = content.map((line: any) => 
                `[${line.time_range}]\nВИЗУАЛ: ${line.visual}\nАУДИО: ${line.audio}\n-------------------`
            ).join('\n');
        } else {
            data = JSON.stringify(content, null, 2);
        }
    } else {
        data = content;
    }
  }

  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${type}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
