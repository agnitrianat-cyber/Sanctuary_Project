import KelayakanClient from "@/components/KelayakanClient";

// Nothing is read from the database yet: the sheet is parsed in the request
// and shown back, so the structure can be agreed before anything is stored.
export default function KelayakanPage() {
  return <KelayakanClient />;
}
