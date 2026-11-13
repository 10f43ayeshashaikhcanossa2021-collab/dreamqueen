import { jsPDF } from 'jspdf';
import type { Order } from '../types';

/**
 * Generates and downloads a real, formatted PDF tax/atelier invoice using jsPDF.
 */
export function downloadOrderInvoicePdf(order: Order): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 44;
  let y = 50;

  // Brand Header Banner
  doc.setFillColor(253, 249, 244); // #FDF9F4
  doc.rect(0, 0, pageWidth, 118, 'F');
  doc.setDrawColor(234, 213, 197); // #EAD5C5
  doc.line(0, 118, pageWidth, 118);

  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(91, 58, 41); // #5B3A29
  doc.text('DreamQueen Atelier', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(112, 130, 56); // #708238
  doc.text('Handmade Crochet Accessories & Bespoke Gifts', margin, y + 18);

  doc.setTextColor(110, 104, 99);
  doc.text(
    'Room No. 30, Building No. 47, Anarya Co. Op. Housing Society, Mahim (East), Mumbai',
    margin,
    y + 34
  );
  doc.text('Email: ayeshalk2025@gmail.com  |  WhatsApp: +91 8097706536', margin, y + 48);

  // Invoice Title Box on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(91, 58, 41);
  doc.text('ORDER INVOICE', pageWidth - margin, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(46, 46, 46);
  doc.text(`Order No: ${order.orderNumber}`, pageWidth - margin, y + 18, { align: 'right' });
  doc.text(
    `Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })}`,
    pageWidth - margin,
    y + 33,
    { align: 'right' }
  );
  doc.text(
    `Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus.toUpperCase()})`,
    pageWidth - margin,
    y + 48,
    { align: 'right' }
  );

  y = 148;

  // Customer & Shipping Info Columns
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(91, 58, 41);
  doc.text('BILLED & SHIPPED TO:', margin, y);
  doc.text('FULFILLMENT & TRACKING:', pageWidth / 2 + 20, y);

  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(46, 46, 46);
  const custName = order.shippingAddress?.fullName || order.customer?.name || 'Customer';
  const custPhone = order.shippingAddress?.phone || order.customer?.phone || '';
  const custEmail = order.shippingAddress?.email || order.customer?.email || '';
  const street = order.shippingAddress?.address || order.shippingAddress?.addressLine1 || '';
  const cityLine = [
    order.shippingAddress?.city,
    order.shippingAddress?.state,
    order.shippingAddress?.pincode
  ]
    .filter(Boolean)
    .join(', ');

  doc.text(custName, margin, y);
  doc.text(`Phone: ${custPhone}`, margin, y + 14);
  if (custEmail) doc.text(`Email: ${custEmail}`, margin, y + 28);
  const wrappedStreet = doc.splitTextToSize(street || '—', 220);
  doc.text(wrappedStreet, margin, y + 42);
  doc.text(cityLine || '', margin, y + 42 + wrappedStreet.length * 12);

  const rightX = pageWidth / 2 + 20;
  doc.text(`Order Status: ${order.trackingStatus.replace(/_/g, ' ').toUpperCase()}`, rightX, y);
  doc.text(`Est. Delivery: ${order.estimatedDeliveryDate || 'Within 7 Days'}`, rightX, y + 14);
  if (order.shiprocketTrackingNumber) {
    doc.text(`Tracking #: ${order.shiprocketTrackingNumber}`, rightX, y + 28);
  }
  if (order.upiTransactionRef) {
    doc.text(`UPI UTR Ref: ${order.upiTransactionRef}`, rightX, y + 42);
  } else if (order.razorpayPaymentId) {
    doc.text(`Razorpay ID: ${order.razorpayPaymentId}`, rightX, y + 42);
  }

  y += Math.max(85, 58 + wrappedStreet.length * 12);

  // Table Header
  doc.setFillColor(255, 248, 240);
  doc.setDrawColor(234, 213, 197);
  doc.rect(margin, y, pageWidth - margin * 2, 24, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(91, 58, 41);
  doc.text('ITEM DESCRIPTION', margin + 10, y + 15);
  doc.text('SHADE', margin + 245, y + 15);
  doc.text('QTY', margin + 350, y + 15, { align: 'right' });
  doc.text('UNIT (INR)', margin + 420, y + 15, { align: 'right' });
  doc.text('TOTAL (INR)', pageWidth - margin - 10, y + 15, { align: 'right' });

  y += 24;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(46, 46, 46);
  for (const item of order.items) {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    const lineTotal = Number(item.price || 0) * Number(item.quantity || 1);
    const nameLines = doc.splitTextToSize(item.productName || 'Handmade Crochet Item', 225);
    const rowHeight = Math.max(26, nameLines.length * 13 + 10);

    doc.setDrawColor(240, 223, 209);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

    doc.text(nameLines, margin + 10, y + 16);
    doc.text(item.color?.name || 'Original', margin + 245, y + 16);
    doc.text(String(item.quantity), margin + 350, y + 16, { align: 'right' });
    doc.text(`Rs. ${item.price}`, margin + 420, y + 16, { align: 'right' });
    doc.text(`Rs. ${lineTotal}`, pageWidth - margin - 10, y + 16, { align: 'right' });

    y += rowHeight;
  }

  y += 22;

  // Summary Box on Right
  const summaryX = pageWidth - margin - 220;
  const valX = pageWidth - margin - 10;

  doc.setFontSize(10);
  doc.text('Subtotal:', summaryX, y);
  doc.text(`Rs. ${order.subtotal}`, valX, y, { align: 'right' });
  y += 16;

  if (order.discount > 0) {
    doc.setTextColor(112, 130, 56);
    doc.text(`Discount${order.couponCode ? ` (${order.couponCode})` : ''}:`, summaryX, y);
    doc.text(`-Rs. ${order.discount}`, valX, y, { align: 'right' });
    doc.setTextColor(46, 46, 46);
    y += 16;
  }

  doc.text('Delivery Fee:', summaryX, y);
  doc.text(order.shippingFee === 0 ? 'FREE' : `Rs. ${order.shippingFee}`, valX, y, {
    align: 'right'
  });
  y += 16;

  if (order.codFee > 0) {
    doc.text('Cash on Delivery Fee:', summaryX, y);
    doc.text(`Rs. ${order.codFee}`, valX, y, { align: 'right' });
    y += 16;
  }

  doc.setDrawColor(91, 58, 41);
  doc.line(summaryX, y, valX, y);
  y += 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(91, 58, 41);
  doc.text('Grand Total Payable:', summaryX, y);
  doc.text(`Rs. ${order.total}`, valX, y, { align: 'right' });

  // Footer Thank-you
  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(110, 104, 99);
  doc.text(
    'Thank you for supporting handcrafted slow fashion made with love by DreamQueen Atelier.',
    pageWidth / 2,
    785,
    { align: 'center' }
  );

  doc.save(`DreamQueen-Invoice-${order.orderNumber}.pdf`);
}
