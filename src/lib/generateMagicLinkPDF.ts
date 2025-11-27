import { jsPDF } from 'jspdf';

/**
 * Generate a branded PDF flyer for magic link distribution
 * Matches the SnapWorxx Free Trial template design
 */
export async function generateMagicLinkPDF(magicLink: string): Promise<Blob> {
  // Create PDF in portrait, using mm units
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210 x 297 mm
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const purpleColor = '#7C3AED'; // SnapWorxx purple
  const darkPurple = '#5B21B6';
  const textGray = '#374151';

  // Left purple sidebar (approximately 45% of page)
  const sidebarWidth = 95;
  doc.setFillColor(124, 58, 237); // Purple
  doc.rect(0, 0, sidebarWidth, pageHeight, 'F');

  // SnapWorxx Logo area (camera icon representation)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(255, 255, 255);
  
  // Camera body (simplified)
  doc.roundedRect(30, 20, 35, 25, 3, 3, 'S');
  doc.setLineWidth(2);
  doc.circle(47.5, 32.5, 8, 'S');
  
  // Camera flash
  doc.setLineWidth(1.5);
  doc.line(55, 18, 60, 18);
  doc.line(60, 18, 60, 22);
  
  // SnapWorxx text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('S N A P W O R X X', 47.5, 58, { align: 'center' });

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SNAPWORXX FREE TRIAL', 47.5, 78, { align: 'center' });

  // Decorative line
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(15, 85, 80, 85);

  // Main content text
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const leftMargin = 10;
  const rightMargin = 85;
  const textWidth = rightMargin - leftMargin;
  let yPos = 98;
  const lineHeight = 7;

  // Invitation text
  const lines = [
    "You're invited to try",
    "SnapWorxx for free.",
    "",
    "Use the personal link below to",
    "set up one event and see how",
    "SnapWorxx works:",
  ];

  lines.forEach(line => {
    doc.text(line, 47.5, yPos, { align: 'center' });
    yPos += lineHeight;
  });

  // Magic Link placeholder
  yPos += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  // Draw a box for the link
  doc.setFillColor(91, 33, 182); // Darker purple
  doc.roundedRect(8, yPos - 5, 79, 18, 2, 2, 'F');
  
  // Show full link (wrapped if needed)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  
  // Split the link for display
  const linkLines = doc.splitTextToSize(magicLink, 70);
  linkLines.forEach((line: string, index: number) => {
    doc.text(line, 47.5, yPos + (index * 4), { align: 'center' });
  });
  
  // Make the link clickable
  doc.link(8, yPos - 5, 79, 18, { url: magicLink });
  
  yPos += 24;

  // More content
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const moreLines = [
    "Share the link with your",
    "guests. They upload photos.",
    "You get a live gallery instantly.",
    "",
    "This free trial link is good for",
    "one event only.",
    "",
    "If you didn't SnapWorxx it...",
    "did it really happen?",
    "",
    "SnapWorxx.com"
  ];

  moreLines.forEach(line => {
    if (line === "SnapWorxx.com") {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
    }
    doc.text(line, 47.5, yPos, { align: 'center' });
    yPos += lineHeight;
  });

  // Right side - placeholder for images (we'll add a decorative element)
  // Add a subtle grid pattern to represent the photo collage
  doc.setFillColor(248, 250, 252); // Light gray background
  doc.rect(sidebarWidth, 0, pageWidth - sidebarWidth, pageHeight, 'F');

  // Add decorative photo grid representation
  const gridStartX = sidebarWidth + 5;
  const gridStartY = pageHeight / 2;
  const cellSize = 12;
  const gridCols = 8;
  const gridRows = 10;

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      // Alternate colors for visual interest
      const colors = [
        [229, 231, 235], // gray-200
        [243, 232, 255], // purple-100
        [252, 231, 243], // pink-100
        [254, 249, 195], // yellow-100
        [220, 252, 231], // green-100
        [224, 242, 254], // blue-100
      ];
      const colorIndex = (row + col) % colors.length;
      doc.setFillColor(colors[colorIndex][0], colors[colorIndex][1], colors[colorIndex][2]);
      doc.rect(gridStartX + col * cellSize, gridStartY + row * cellSize, cellSize - 1, cellSize - 1, 'F');
    }
  }

  // Add a smartphone illustration
  const phoneX = sidebarWidth + 30;
  const phoneY = 30;
  const phoneWidth = 50;
  const phoneHeight = 90;

  // Phone body
  doc.setFillColor(31, 41, 55); // gray-800
  doc.roundedRect(phoneX, phoneY, phoneWidth, phoneHeight, 5, 5, 'F');

  // Phone screen
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(phoneX + 3, phoneY + 8, phoneWidth - 6, phoneHeight - 16, 2, 2, 'F');

  // Screen content - gradient-like effect
  doc.setFillColor(243, 232, 255);
  doc.rect(phoneX + 3, phoneY + 8, phoneWidth - 6, 30, 'F');

  // Camera icon on screen
  doc.setFillColor(124, 58, 237);
  doc.circle(phoneX + phoneWidth / 2, phoneY + 45, 12, 'F');
  doc.setFillColor(255, 255, 255);
  doc.circle(phoneX + phoneWidth / 2, phoneY + 45, 8, 'F');
  doc.setFillColor(124, 58, 237);
  doc.circle(phoneX + phoneWidth / 2, phoneY + 45, 4, 'F');

  // Text under phone
  doc.setTextColor(124, 58, 237);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Scan • Upload • Share', phoneX + phoneWidth / 2, phoneY + phoneHeight + 10, { align: 'center' });

  // Add QR code area (placeholder - actual QR would need additional library)
  const qrSize = 40;
  const qrX = sidebarWidth + 35;
  const qrY = 145;
  
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX, qrY, qrSize, qrSize, 'F');
  doc.setDrawColor(124, 58, 237);
  doc.setLineWidth(1);
  doc.rect(qrX, qrY, qrSize, qrSize, 'S');
  
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text('QR Code', qrX + qrSize / 2, qrY + qrSize / 2 + 2, { align: 'center' });

  doc.setTextColor(124, 58, 237);
  doc.setFontSize(9);
  doc.text('Scan to get started', qrX + qrSize / 2, qrY + qrSize + 8, { align: 'center' });

  // Footer on right side
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text('© 2025 SnapWorxx. All rights reserved.', pageWidth / 2 + sidebarWidth / 2, pageHeight - 10, { align: 'center' });

  // Return as blob
  return doc.output('blob');
}

/**
 * Download the magic link PDF
 */
export async function downloadMagicLinkPDF(magicLink: string, filename?: string): Promise<void> {
  const blob = await generateMagicLinkPDF(magicLink);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'snapworxx-free-trial.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
