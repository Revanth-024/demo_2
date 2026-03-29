import { jsPDF } from "jspdf";
import { FIRData } from "../types";

export function generateFIRPDF(data: FIRData) {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = 210;
  let y = 20;

  // Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("FIRST INFORMATION REPORT", pageWidth / 2, y, { align: "center" });
  y += 10;
  doc.setFontSize(9);
  doc.text("A.P.P.M. Orders 470,500", pageWidth - margin, y, { align: "right" });
  y += 10;

  // Horizontal Line
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  const addRow = (label: string, value: string, xOffset = 0) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.text(label, margin + xOffset, y);
    
    doc.setFont("helvetica", "normal");
    const labelWidth = doc.getTextWidth(label);
    const valueX = margin + 65 + xOffset; // Fixed column for values
    
    if (value) {
      const splitVal = doc.splitTextToSize(value, pageWidth - valueX - margin);
      doc.text(splitVal, valueX, y);
      y += (splitVal.length * 6) + 2;
    } else {
      doc.text("................................................................................", valueX, y);
      y += 8;
    }
  };

  doc.setFontSize(10);
  
  // Section 1
  addRow("1. District:", data.district);
  addRow("   P.S.:", data.ps);
  addRow("   Year:", data.year);
  addRow("   FIR No.:", data.firNo);
  addRow("   Date:", data.date);

  // Section 2
  addRow("2. Acts & Section(s):", data.actsAndSections);

  // Section 3
  doc.setFont("helvetica", "bold");
  doc.text("3. a) Occurrence of Offence:", margin, y);
  y += 6;
  addRow("      Day:", data.occurrenceDay, 10);
  addRow("      Date & Time From:", `${data.occurrenceDateFrom} ${data.occurrenceTimeFrom}`, 10);
  addRow("      Date & Time To:", `${data.occurrenceDateTo} ${data.occurrenceTimeTo}`, 10);
  addRow("      Time Period:", data.timePeriod, 10);
  y += 2;
  addRow("   b) Information Received at P.S.:", `${data.infoReceivedAtPSDate} ${data.infoReceivedAtPSTime}`);
  addRow("   c) General Diary Reference:", `Entry No: ${data.gdEntryNo}, Date: ${data.gdDate}, Time: ${data.gdTime}`);

  // Section 4
  addRow("4. Type of Information:", data.typeOfInformation);

  // Section 5
  doc.setFont("helvetica", "bold");
  doc.text("5. Place of Occurrence:", margin, y);
  y += 6;
  addRow("      Address:", data.placeAddress, 10);
  addRow("      Area/Mandal:", data.placeAreaMandal, 10);
  addRow("      Street/Village:", data.placeStreetVillage, 10);
  addRow("      City/District:", data.placeCityDistrict, 10);
  addRow("      State:", data.placeState, 10);
  addRow("      PIN:", data.placePIN, 10);
  addRow("      Distance/Direction:", data.placeDistanceDirection, 10);
  addRow("      Beat No:", data.beatNo, 10);

  // Section 6
  doc.setFont("helvetica", "bold");
  doc.text("6. Complainant / Informant:", margin, y);
  y += 6;
  addRow("      a) Name:", data.complainantName, 10);
  addRow("      b) Father's/Husband's Name:", data.complainantFatherHusbandName, 10);
  addRow("      c) Date/Year of Birth:", data.complainantDOB, 10);
  addRow("      d) Age:", data.complainantAge, 10);
  addRow("      e) Nationality:", data.complainantNationality, 10);
  addRow("      f) Caste:", data.complainantCaste, 10);
  addRow("      g) Passport No:", data.complainantPassportNo, 10);
  addRow("      h) Occupation:", data.complainantOccupation, 10);
  addRow("      i) Mobile No:", data.complainantMobile, 10);
  addRow("      j) Address:", data.complainantAddress, 10);

  // Section 7
  addRow("7. Details of Accused:", data.accusedDetails);

  // Section 8
  addRow("8. Reasons for delay in reporting:", data.delayReasons);

  // Section 9
  addRow("9. Particulars of properties stolen:", data.stolenProperties);
  addRow("   Total value of properties stolen:", data.totalValueStolen);

  // Section 10
  addRow("10. Inquest Report / U.D. Case No.:", data.inquestReport);

  // Section 12
  doc.setFont("helvetica", "bold");
  doc.text("12. Contents of the complaint / statement:", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const contents = data.complaintContents || "....................................................................................................";
  const splitContents = doc.splitTextToSize(contents, pageWidth - (margin * 2));
  doc.text(splitContents, margin, y);
  y += (splitContents.length * 6) + 20;

  // Signatures
  if (y > 250) {
    doc.addPage();
    y = 40;
  }
  doc.setFont("helvetica", "bold");
  doc.text("Signature / Thumb impression of the", margin, y);
  doc.text("Signature of Officer in charge, Police Station", pageWidth - margin - 80, y);
  y += 5;
  doc.text("complainant / informant.", margin, y);

  doc.save(`FIR_${data.firNo || "Draft"}.pdf`);
}
