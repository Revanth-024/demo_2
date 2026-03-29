import React from 'react';
import { FIRData } from '../types';
import { FileText, Download } from 'lucide-react';
import { generateFIRPDF } from '../services/pdfService';

interface FIRPreviewProps {
  data: FIRData;
}

export const FIRPreview: React.FC<FIRPreviewProps> = ({ data }) => {
  const fields = [
    { label: 'District', value: data.district },
    { label: 'Police Station', value: data.ps },
    { label: 'Year', value: data.year },
    { label: 'FIR No', value: data.firNo },
    { label: 'Date', value: data.date },
    { label: 'Acts & Sections', value: data.actsAndSections },
    { label: 'Occurrence Day', value: data.occurrenceDay },
    { label: 'Date From', value: data.occurrenceDateFrom },
    { label: 'Time From', value: data.occurrenceTimeFrom },
    { label: 'Date To', value: data.occurrenceDateTo },
    { label: 'Time To', value: data.occurrenceTimeTo },
    { label: 'Time Period', value: data.timePeriod },
    { label: 'Info Received Date', value: data.infoReceivedAtPSDate },
    { label: 'Info Received Time', value: data.infoReceivedAtPSTime },
    { label: 'GD Entry No', value: data.gdEntryNo },
    { label: 'GD Date', value: data.gdDate },
    { label: 'GD Time', value: data.gdTime },
    { label: 'Type of Information', value: data.typeOfInformation },
    { label: 'Place Address', value: data.placeAddress },
    { label: 'Area/Mandal', value: data.placeAreaMandal },
    { label: 'Street/Village', value: data.placeStreetVillage },
    { label: 'City/District', value: data.placeCityDistrict },
    { label: 'State', value: data.placeState },
    { label: 'PIN', value: data.placePIN },
    { label: 'Distance/Direction', value: data.placeDistanceDirection },
    { label: 'Beat No', value: data.beatNo },
    { label: 'Complainant Name', value: data.complainantName },
    { label: 'Father/Husband', value: data.complainantFatherHusbandName },
    { label: 'Date/Year of Birth', value: data.complainantDOB },
    { label: 'Age', value: data.complainantAge },
    { label: 'Nationality', value: data.complainantNationality },
    { label: 'Caste', value: data.complainantCaste },
    { label: 'Passport No', value: data.complainantPassportNo },
    { label: 'Occupation', value: data.complainantOccupation },
    { label: 'Mobile No', value: data.complainantMobile },
    { label: 'Address', value: data.complainantAddress },
    { label: 'Accused Details', value: data.accusedDetails },
    { label: 'Delay Reasons', value: data.delayReasons },
    { label: 'Stolen Property', value: data.stolenProperties },
    { label: 'Total Value', value: data.totalValueStolen },
    { label: 'Inquest Report / U.D. Case No', value: data.inquestReport },
  ];

  const missingFieldsCount = fields.filter(f => !f.value).length;

  const fullWidthFields = [
    'Acts & Sections',
    'Place Address',
    'Address',
    'Accused Details',
    'Delay Reasons',
    'Stolen Property',
    'Inquest Report / U.D. Case No'
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="bg-gray-50 p-4 border-bottom border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-gray-800">Live FIR Preview</h2>
          {missingFieldsCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase">
              {missingFieldsCount} Missing
            </span>
          )}
        </div>
        <button
          onClick={() => generateFIRPDF(data)}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="text-center border-b pb-4">
          <h3 className="text-lg font-bold uppercase">First Information Report</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {fields.map((field, idx) => (
            <div key={idx} className={fullWidthFields.includes(field.label) ? 'col-span-2' : ''}>
              <label className="text-xs font-medium text-gray-400 uppercase block mb-1">{field.label}</label>
              <div className="p-2 bg-gray-50 rounded border border-gray-100 min-h-[32px]">
                {field.value || <span className="text-gray-300 italic">Not provided</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase block">Complaint Contents</label>
          <div className="p-4 bg-gray-50 rounded border border-gray-100 min-h-[150px] text-sm whitespace-pre-wrap">
            {data.complaintContents || <span className="text-gray-300 italic">Waiting for statement...</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
