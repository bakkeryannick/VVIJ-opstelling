import { toPng } from 'html-to-image';

export async function exportFieldAsImage(
  element: HTMLElement,
  filename = 'vvij-opstelling.png'
): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      backgroundColor: '#f3f4f6',
      pixelRatio: 2,
      cacheBust: true,
    });

    // Try Web Share API first (works well on mobile)
    if (navigator.share && navigator.canShare) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], filename, { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'VVIJ Opstelling',
            files: [file],
          });
          return;
        }
      } catch {
        // Fall through to download
      }
    }

    // Fallback: download the image
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Export failed:', err);
    throw new Error('Kon afbeelding niet exporteren');
  }
}
