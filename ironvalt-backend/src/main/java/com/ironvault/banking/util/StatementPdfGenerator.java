package com.ironvault.banking.util;

import com.ironvault.banking.model.Transaction;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.awt.Color;

@Component
public class StatementPdfGenerator {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // Subtle, professional palette (mostly grayscale with one accent).
    private static final Color ACCENT      = new Color(28, 41, 64);    // deep navy
    private static final Color BAND        = new Color(244, 246, 249); // light band
    private static final Color BORDER      = new Color(210, 215, 222); // light border
    private static final Color TEXT_DARK   = new Color(33, 37, 41);
    private static final Color TEXT_MUTED  = new Color(110, 118, 128);
    // private static final Color STATUS_OK   = new Color(34, 102, 56);   // muted green
    // private static final Color STATUS_WARN = new Color(170, 90, 20);   // muted amber

    private static final Font FONT_BRAND      = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18f, Color.WHITE);
    private static final Font FONT_TAGLINE    = FontFactory.getFont(FontFactory.HELVETICA, 9f, new Color(210, 218, 230));
    private static final Font FONT_SECTION    = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10f, TEXT_MUTED);
    private static final Font FONT_LABEL      = FontFactory.getFont(FontFactory.HELVETICA, 9f, TEXT_MUTED);
    private static final Font FONT_VALUE      = FontFactory.getFont(FontFactory.HELVETICA, 10f, TEXT_DARK);
    private static final Font FONT_VALUE_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10f, TEXT_DARK);
    private static final Font FONT_AMOUNT     = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14f, TEXT_DARK);
    private static final Font FONT_FOOTER     = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8f, TEXT_MUTED);

    public byte[] generate(Transaction transaction, String username) {
        try {
            // A4 page
            Rectangle page = PageSize.A4;
            Document document = new Document(page, 48, 48, 54, 48);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, outputStream);
            document.open();

            // --- Header band ---
            PdfPTable header = new PdfPTable(1);
            header.setWidthPercentage(100);
            PdfPCell headerCell = new PdfPCell();
            headerCell.setBackgroundColor(ACCENT);
            headerCell.setBorder(Rectangle.NO_BORDER);
            headerCell.setPadding(18f);

            Paragraph brand = new Paragraph("IronVault", FONT_BRAND);
            brand.setSpacingAfter(2f);
            Paragraph tagline = new Paragraph("Official Transaction Statement", FONT_TAGLINE);
            headerCell.addElement(brand);
            headerCell.addElement(tagline);
            header.addCell(headerCell);
            document.add(header);

            // --- Document meta (ID, date) ---
            document.add(space(14));

            PdfPTable meta = new PdfPTable(2);
            meta.setWidthPercentage(100);
            meta.setWidths(new float[]{1f, 1f});

            addMetaCell(meta, "CUSTOMER", safe(username));
            addMetaCell(meta, "ISSUED ON", DATE_FMT.format(java.time.LocalDateTime.now()));

            document.add(meta);
            document.add(space(8));

            // Thin divider
            document.add(divider());

            // --- Amount block ---
            document.add(space(16));

            String sign = isCredit(transaction) ? "+ " : "- ";
            String amountText = sign + "$" + transaction.getAmount().toPlainString();

            PdfPTable amountRow = new PdfPTable(2);
            amountRow.setWidthPercentage(100);
            amountRow.setWidths(new float[]{1f, 1f});
            amountRow.setSpacingAfter(10f);

            PdfPCell amountLabelCell = new PdfPCell(new Phrase("AMOUNT", FONT_SECTION));
            amountLabelCell.setBorder(Rectangle.NO_BORDER);
            amountLabelCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            amountLabelCell.setPadding(4f);

            PdfPCell amountValueCell = new PdfPCell(new Phrase(amountText, FONT_AMOUNT));
            amountValueCell.setBorder(Rectangle.NO_BORDER);
            amountValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            amountValueCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            amountValueCell.setPadding(4f);

            amountRow.addCell(amountLabelCell);
            amountRow.addCell(amountValueCell);
            document.add(amountRow);

            // Status pill (single-cell table acts as a rounded-ish pill)
            PdfPTable pillWrap = new PdfPTable(1);
            pillWrap.setWidthPercentage(100);
            PdfPCell pill = new PdfPCell(new Phrase(transaction.getStatus().toString(), pillFont()));
            pill.setHorizontalAlignment(Element.ALIGN_CENTER);
            pill.setPadding(5f);
            pill.setBackgroundColor(BAND);
            pill.setBorderColor(BORDER);
            pill.setBorderWidth(0.8f);
            pillWrap.addCell(pill);
            document.add(pillWrap);

            document.add(space(22));
            document.add(divider());
            document.add(space(14));

            // --- Section: Transaction Details (two-column key/value table) ---
            Paragraph detailsTitle = new Paragraph("TRANSACTION DETAILS", FONT_SECTION);
            detailsTitle.setSpacingAfter(8f);
            document.add(detailsTitle);

            PdfPTable details = twoColTable();
            addRow(details, "Transaction ID", transaction.getTransactionId(), true);
            addRow(details, "Type", transaction.getType().toString(), false);
            addRow(details, "Date", DATE_FMT.format(transaction.getTimestamp()), false);
            if (transaction.getFromAccount() != null) {
                addRow(details, "From Account", transaction.getFromAccount().getAccountNumber(), false);
            }
            if (transaction.getToAccount() != null) {
                addRow(details, "To Account", transaction.getToAccount().getAccountNumber(), false);
            }
            addRow(details, "Status", transaction.getStatus().toString(), false);
            document.add(details);

            // --- Footer ---
            document.add(space(28));
            Paragraph footer = new Paragraph(
                    "This is a system-generated statement from IronVault Banking. "
                            + "Please retain for your records.",
                    FONT_FOOTER
            );
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to generate PDF statement: " + e.getMessage());
        }
    }

    // ---------- helpers ----------

    private static boolean isCredit(Transaction t) {
        return t.getToAccount() != null && t.getFromAccount() == null;
    }

    private static PdfPTable twoColTable() {
        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        t.setWidths(new float[]{0.9f, 1.6f});
        t.setSpacingBefore(2f);
        return t;
    }

    private static void addRow(PdfPTable table, String label, String value, boolean first) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label.toUpperCase(), FONT_LABEL));
        labelCell.setBorder(Rectangle.BOTTOM);
        labelCell.setBorderColor(BORDER);
        labelCell.setPadding(7f);
        labelCell.setBackgroundColor(first ? BAND : Color.WHITE);

        PdfPCell valueCell = new PdfPCell(new Phrase(value == null ? "—" : value, FONT_VALUE));
        valueCell.setBorder(Rectangle.BOTTOM);
        valueCell.setBorderColor(BORDER);
        valueCell.setPadding(7f);
        valueCell.setBackgroundColor(first ? BAND : Color.WHITE);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private static void addMetaCell(PdfPTable table, String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPaddingBottom(2f);

        Paragraph pLabel = new Paragraph(label, FONT_LABEL);
        pLabel.setSpacingAfter(2f);
        cell.addElement(pLabel);
        cell.addElement(new Paragraph(value == null ? "—" : value, FONT_VALUE_BOLD));

        table.addCell(cell);
    }

    private static Element divider() {
        PdfPTable line = new PdfPTable(1);
        line.setWidthPercentage(100);
        PdfPCell c = new PdfPCell();
        c.setBorder(Rectangle.NO_BORDER);
        c.setBorderWidthTop(0.6f);
        c.setBorderColorTop(BORDER);
        c.setFixedHeight(0.6f);
        line.addCell(c);
        line.setSpacingAfter(0f);
        return line;
    }

    private static Element space(float pts) {
        Paragraph p = new Paragraph(" ");
        p.setLeading(pts);
        return p;
    }

    private static Font pillFont() {
        // Neutral muted color; OPENPDF font colors are per-instance.
        return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9f, TEXT_MUTED);
    }

    private static String safe(String s) {
        return s == null || s.isBlank() ? "—" : s;
    }
}

