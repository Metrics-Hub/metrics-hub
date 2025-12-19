// PDF Export utility using browser print functionality
// This approach works without external dependencies

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  content: string;
  metadata?: Record<string, string>;
}

export function exportToPDF(options: PDFExportOptions): void {
  const { title, subtitle, content, metadata } = options;

  // Create a new window for printing
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Popup blocked. Please allow popups for this site.");
  }

  // Build metadata section
  const metadataHtml = metadata
    ? Object.entries(metadata)
        .map(
          ([key, value]) =>
            `<div class="metadata-item"><strong>${key}:</strong> ${value}</div>`
        )
        .join("")
    : "";

  // Format content - convert markdown-like formatting to HTML
  const formattedContent = content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/^- (.*$)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @page {
          size: A4;
          margin: 2cm;
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #1a1a1a;
          background: white;
          padding: 20px;
        }
        
        .header {
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .logo {
          font-size: 24pt;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 5px;
        }
        
        h1 {
          font-size: 20pt;
          color: #1a1a1a;
          margin-bottom: 5px;
        }
        
        .subtitle {
          font-size: 12pt;
          color: #666;
        }
        
        .metadata {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 30px;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        
        .metadata-item {
          font-size: 10pt;
        }
        
        .content {
          font-size: 11pt;
        }
        
        .content h1 {
          font-size: 16pt;
          margin: 20px 0 10px;
          color: #2563eb;
        }
        
        .content h2 {
          font-size: 14pt;
          margin: 18px 0 8px;
          color: #1a1a1a;
        }
        
        .content h3 {
          font-size: 12pt;
          margin: 15px 0 8px;
          color: #333;
        }
        
        .content p {
          margin-bottom: 12px;
        }
        
        .content ul {
          margin: 10px 0 10px 20px;
        }
        
        .content li {
          margin-bottom: 5px;
        }
        
        .content strong {
          color: #1a1a1a;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 9pt;
          color: #999;
          text-align: center;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="background: #f0f0f0; padding: 10px; margin-bottom: 20px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #2563eb; color: white; border: none; border-radius: 5px;">
          Imprimir / Salvar como PDF
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; margin-left: 10px; background: #666; color: white; border: none; border-radius: 5px;">
          Fechar
        </button>
      </div>
      
      <div class="header">
        <div class="logo">Launx Metrics</div>
        <h1>${title}</h1>
        ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
      </div>
      
      ${metadataHtml ? `<div class="metadata">${metadataHtml}</div>` : ""}
      
      <div class="content">
        <p>${formattedContent}</p>
      </div>
      
      <div class="footer">
        Relatório gerado automaticamente por Launx Metrics • ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function exportDashboardToPDF(
  title: string,
  metrics: {
    leads: number;
    spend: number;
    cpl: number;
    ctr: number;
    impressions: number;
    clicks: number;
    reach: number;
  },
  period: string,
  goal: number
): void {
  const formatCurrency = (v: number) =>
    `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const formatNumber = (v: number) => v.toLocaleString("pt-BR");

  const content = `
## Resumo Executivo

Este relatório apresenta os principais indicadores de performance das campanhas de Meta Ads para o período selecionado.

## Métricas Principais

### Geração de Leads
- **Leads Gerados:** ${metrics.leads}
- **Meta:** ${goal} leads
- **Progresso:** ${((metrics.leads / goal) * 100).toFixed(1)}%

### Investimento
- **Total Investido:** ${formatCurrency(metrics.spend)}
- **Custo por Lead (CPL):** ${formatCurrency(metrics.cpl)}

### Engajamento
- **Impressões:** ${formatNumber(metrics.impressions)}
- **Alcance:** ${formatNumber(metrics.reach)}
- **Cliques:** ${formatNumber(metrics.clicks)}
- **Taxa de Cliques (CTR):** ${metrics.ctr.toFixed(2)}%

## Análise

${
  metrics.cpl > 0
    ? `O custo por lead atual de ${formatCurrency(metrics.cpl)} ${
        metrics.cpl <= 50
          ? "está dentro do esperado para campanhas de geração de leads."
          : metrics.cpl <= 100
          ? "está moderado. Considere otimizar os criativos para reduzir custos."
          : "está elevado. Recomenda-se revisão urgente da estratégia de segmentação."
      }`
    : ""
}

${
  metrics.ctr > 0
    ? `A taxa de cliques de ${metrics.ctr.toFixed(2)}% ${
        metrics.ctr >= 2
          ? "indica bom engajamento com os anúncios."
          : metrics.ctr >= 1
          ? "está na média. Teste novos criativos para melhorar."
          : "está abaixo do ideal. Revise os criativos e a segmentação."
      }`
    : ""
}
  `;

  exportToPDF({
    title,
    subtitle: `Período: ${period}`,
    content,
    metadata: {
      Período: period,
      "Data de Geração": new Date().toLocaleDateString("pt-BR"),
      Leads: metrics.leads.toString(),
      Investimento: formatCurrency(metrics.spend),
    },
  });
}
