/**
 * PDF Export Utility
 * Simple PDF generation using browser print functionality
 * For more advanced PDF generation, consider using libraries like jsPDF or pdfmake
 */

import { BRAND, BRAND_COLORS } from './brand';

interface PDFExportOptions {
  title: string;
  content: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Generates a printable PDF from HTML content
 */
export function generatePDF({ title, content, filename: _filename, orientation = 'portrait' }: PDFExportOptions): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups for this website');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html dir="auto">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @page {
          size: A4 ${orientation};
          margin: 15mm;
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        
        .pdf-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid ${BRAND_COLORS.primary[700]};
        }
        
        .pdf-header h1 {
          color: ${BRAND_COLORS.primary[700]};
          margin: 0 0 5px 0;
          font-size: 24px;
        }
        
        .pdf-header .subtitle {
          color: #666;
          font-size: 14px;
        }
        
        .pdf-header .date {
          color: #888;
          font-size: 11px;
          margin-top: 10px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        
        th, td {
          padding: 8px 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        th {
          background: #f8f9fa;
          font-weight: 600;
          color: ${BRAND_COLORS.primary[700]};
        }
        
        tr:hover {
          background: #f8f9fa;
        }
        
        .total-row {
          font-weight: bold;
          background: #e8f4f8;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .summary-box {
          background: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
          margin: 15px 0;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }
        
        .summary-row.total {
          border-top: 2px solid ${BRAND_COLORS.primary[700]};
          margin-top: 10px;
          padding-top: 10px;
          font-size: 16px;
          font-weight: bold;
        }
        
        .pdf-footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #888;
          font-size: 10px;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      ${content}
      <div class="pdf-footer">
        <p>${BRAND.name.fr} - Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
      </div>
      <script>
        window.onload = function() {
          window.print();
          window.close();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Generates a Z-Report PDF
 */
export function generateZReportPDF(data: {
  date: string;
  cashierName: string;
  openingAmount: number;
  closingAmount: number;
  totalRevenue: number;
  transactionCount: number;
  payments: { cash: number; card: number; transfer: number };
  topServices: { name: string; count: number; revenue: number }[];
}): void {
  const content = `
    <div class="pdf-header">
      <h1>${BRAND.name.fr.toUpperCase()}</h1>
      <div class="subtitle">${BRAND.subtitle.fr}</div>
      <div class="date">Z-Report - ${data.date}</div>
    </div>
    
    <div class="summary-box">
      <div class="summary-row">
        <span>Caissier:</span>
        <span>${data.cashierName}</span>
      </div>
      <div class="summary-row">
        <span>Fond de caisse:</span>
        <span>${data.openingAmount.toLocaleString()} DZD</span>
      </div>
      <div class="summary-row">
        <span>Montant en caisse:</span>
        <span>${data.closingAmount.toLocaleString()} DZD</span>
      </div>
      <div class="summary-row">
        <span>Transactions:</span>
        <span>${data.transactionCount}</span>
      </div>
      <div class="summary-row total">
        <span>CHIFFRE D'AFFAIRES:</span>
        <span>${data.totalRevenue.toLocaleString()} DZD</span>
      </div>
    </div>
    
    <h3>Répartition des Paiements</h3>
    <table>
      <tr>
        <th>Mode de paiement</th>
        <th class="text-right">Montant</th>
      </tr>
      <tr>
        <td>Espèces</td>
        <td class="text-right">${data.payments.cash.toLocaleString()} DZD</td>
      </tr>
      <tr>
        <td>Carte bancaire</td>
        <td class="text-right">${data.payments.card.toLocaleString()} DZD</td>
      </tr>
      <tr>
        <td>Virement</td>
        <td class="text-right">${data.payments.transfer.toLocaleString()} DZD</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL</td>
        <td class="text-right">${(data.payments.cash + data.payments.card + data.payments.transfer).toLocaleString()} DZD</td>
      </tr>
    </table>
    
    <h3>Services Populaires</h3>
    <table>
      <tr>
        <th>Service</th>
        <th class="text-center">Quantité</th>
        <th class="text-right">Revenu</th>
      </tr>
      ${data.topServices.map(s => `
        <tr>
          <td>${s.name}</td>
          <td class="text-center">${s.count}</td>
          <td class="text-right">${s.revenue.toLocaleString()} DZD</td>
        </tr>
      `).join('')}
    </table>
  `;

  generatePDF({
    title: `Z-Report ${data.date}`,
    content,
    filename: `z-report-${data.date}.pdf`,
  });
}

/**
 * Generates a period report PDF
 */
export function generatePeriodReportPDF(data: {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalTransactions: number;
  dailyData: { date: string; revenue: number; transactions: number }[];
}): void {
  const content = `
    <div class="pdf-header">
      <h1>${BRAND.name.fr.toUpperCase()}</h1>
      <div class="subtitle">Rapport de Période</div>
      <div class="date">Du ${data.startDate} au ${data.endDate}</div>
    </div>
    
    <div class="summary-box">
      <div class="summary-row total">
        <span>CHIFFRE D'AFFAIRES TOTAL:</span>
        <span>${data.totalRevenue.toLocaleString()} DZD</span>
      </div>
      <div class="summary-row">
        <span>Nombre de transactions:</span>
        <span>${data.totalTransactions}</span>
      </div>
      <div class="summary-row">
        <span>Moyenne journalière:</span>
        <span>${Math.round(data.totalRevenue / data.dailyData.length).toLocaleString()} DZD</span>
      </div>
    </div>
    
    <h3>Détail Journalier</h3>
    <table>
      <tr>
        <th>Date</th>
        <th class="text-center">Transactions</th>
        <th class="text-right">Revenu</th>
      </tr>
      ${data.dailyData.map(d => `
        <tr>
          <td>${d.date}</td>
          <td class="text-center">${d.transactions}</td>
          <td class="text-right">${d.revenue.toLocaleString()} DZD</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td>TOTAL</td>
        <td class="text-center">${data.totalTransactions}</td>
        <td class="text-right">${data.totalRevenue.toLocaleString()} DZD</td>
      </tr>
    </table>
  `;

  generatePDF({
    title: `Rapport ${data.startDate} - ${data.endDate}`,
    content,
    filename: `rapport-periode-${data.startDate}-${data.endDate}.pdf`,
    orientation: 'portrait',
  });
}
