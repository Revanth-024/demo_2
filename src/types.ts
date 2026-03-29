export interface FIRData {
  district: string;
  ps: string;
  year: string;
  firNo: string;
  date: string;
  actsAndSections: string;
  occurrenceDay: string;
  occurrenceDateFrom: string;
  occurrenceTimeFrom: string;
  occurrenceDateTo: string;
  occurrenceTimeTo: string;
  timePeriod: string;
  infoReceivedAtPSDate: string;
  infoReceivedAtPSTime: string;
  gdEntryNo: string;
  gdDate: string;
  gdTime: string;
  typeOfInformation: string;
  placeDistanceDirection: string;
  beatNo: string;
  placeAddress: string;
  placeAreaMandal: string;
  placeStreetVillage: string;
  placeCityDistrict: string;
  placeState: string;
  placePIN: string;
  complainantName: string;
  complainantFatherHusbandName: string;
  complainantDOB: string;
  complainantAge: string;
  complainantNationality: string;
  complainantCaste: string;
  complainantPassportNo: string;
  complainantOccupation: string;
  complainantMobile: string;
  complainantAddress: string;
  accusedDetails: string;
  delayReasons: string;
  stolenProperties: string;
  totalValueStolen: string;
  inquestReport: string;
  complaintContents: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
