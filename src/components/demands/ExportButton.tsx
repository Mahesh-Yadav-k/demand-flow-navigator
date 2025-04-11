
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { Demand, DemandFilters } from "@/types";
import { exportDataToExcel } from "@/utils/excelExport";

interface ExportButtonProps {
  filteredDemands: Demand[];
  filters: DemandFilters;
}

export function ExportButton({ filteredDemands, filters }: ExportButtonProps) {
  const handleExport = () => {
    // Create a cleaner version of the data for export
    const exportData = filteredDemands.map(demand => ({
      "ID": demand.id,
      "Account": demand.accountName || "",
      "Role Code": demand.roleCode || "",
      "Location": demand.location || "",
      "Start Month": demand.startMonth || "",
      "Duration": demand.duration || "",
      "Status": demand.status || "",
      "Added By": demand.addedBy || "",
      "Added On": demand.addedOn || "",
      "Last Updated By": demand.lastUpdatedBy || "",
      "Updated On": demand.updatedOn || "",
      "Comments": demand.comments || ""
    }));
    
    // Generate filename based on filters
    let filename = "demands";
    if (Object.keys(filters).some(key => filters[key as keyof DemandFilters]?.length)) {
      filename += "-filtered";
    }
    
    exportDataToExcel(exportData, filename);
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleExport}
      className="flex items-center gap-2"
    >
      <FileSpreadsheet className="h-4 w-4" />
      <span>Download as Excel</span>
    </Button>
  );
}
