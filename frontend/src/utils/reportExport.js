import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OCD_QUESTIONS } from './assessmentConstants';

const SCORE_LABELS = {
  0: 'Never',
  1: 'Rarely',
  2: 'Sometimes',
  3: 'Often',
  4: 'Always',
};

const formatDimensionKey = (key = '') =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

const getResponseRows = (report) => {
  const responses = report?.responses || {};

  return Object.entries(responses).map(([key, value], index) => {
    const numericScore = Number(value) || 0;
    const question = OCD_QUESTIONS[key]?.question || formatDimensionKey(key);

    return {
      index: index + 1,
      dimension: formatDimensionKey(key),
      question,
      answer: SCORE_LABELS[numericScore] || `Score ${numericScore}`,
      score: numericScore,
    };
  });
};

const buildReportPdf = (report) => {
  const doc = new jsPDF();
  const rows = getResponseRows(report);

  doc.setFontSize(18);
  doc.text('Compulysis Assessment Report', 14, 18);

  doc.setFontSize(11);
  doc.text(`Report ID: ${report?.reportId || 'N/A'}`, 14, 26);
  doc.text(`Date: ${new Date(report?.date || Date.now()).toLocaleString()}`, 14, 32);

  autoTable(doc, {
    startY: 38,
    head: [['Field', 'Value']],
    body: [
      ['Patient Name', report?.patientName || 'Anonymous'],
      ['Risk Level', report?.riskLevel || 'N/A'],
      ['Total Score', `${report?.totalScore ?? 0}/36`],
      ['Confidence', `${report?.confidence ?? 'N/A'}%`],
      ['Age', report?.demographics?.age ?? 'N/A'],
      ['Gender', report?.demographics?.gender ?? 'N/A'],
      ['Education', report?.demographics?.education ?? 'N/A'],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['#', 'Dimension', 'Question', 'Answer', 'Score']],
    body: rows.map((item) => [
      item.index,
      item.dimension,
      item.question,
      item.answer,
      `${item.score}/4`,
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 35 },
      2: { cellWidth: 90 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
    },
  });

  const notesY = doc.lastAutoTable.finalY + 10;
  const wrappedNotes = doc.splitTextToSize(report?.clinicalNotes || 'No clinical notes.', 180);

  doc.setFontSize(11);
  doc.text('Clinical Notes', 14, notesY);
  doc.setFontSize(10);
  doc.text(wrappedNotes, 14, notesY + 6);

  return doc;
};

export const downloadReportAsPdf = (report) => {
  const doc = buildReportPdf(report);

  doc.save(`${report?.reportId || 'Assessment'}_Report.pdf`);
};

export const printReport = (report) => {
  const doc = buildReportPdf(report);
  const blobUrl = doc.output('bloburl');

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        iframe.remove();
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    }
  };

  document.body.appendChild(iframe);
};
