
export const APP_NAME = "TindaPH";

export const SUPABASE_URL = "https://jyaqoopmtymvwtoaatzb.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5YXFvb3BtdHltdnd0b2FhdHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODU1NDYsImV4cCI6MjA3OTU2MTU0Nn0.FugJEpjasitq4CSexGWh-4JXmxdx8sbz2SfiAvNpS_A";

export const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Living",
  "Vehicles",
  "Hobbies",
  "Property",
  "Services",
  "Other"
];

// Simplified Philippine Geography for Demo
export const PH_LOCATIONS = [
  {
    region: "NCR",
    provinces: [
      {
        name: "Metro Manila",
        cities: ["Manila", "Quezon City", "Makati", "Taguig", "Pasig"]
      }
    ]
  },
  {
    region: "Region VII (Central Visayas)",
    provinces: [
      {
        name: "Cebu",
        cities: ["Cebu City", "Mandaue", "Lapu-Lapu", "Talisay"]
      },
      {
        name: "Bohol",
        cities: ["Tagbilaran"]
      }
    ]
  },
  {
    region: "Region XI (Davao Region)",
    provinces: [
      {
        name: "Davao del Sur",
        cities: ["Davao City", "Digos"]
      }
    ]
  }
];