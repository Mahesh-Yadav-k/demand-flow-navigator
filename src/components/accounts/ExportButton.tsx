
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { Account, AccountFilters } from "@/types";
import { exportDataToExcel } from "@/utils/excelExport";

interface ExportButtonProps {
  filteredAccounts: Account[];
  filters: AccountFilters;
}

export function ExportButton({ filteredAccounts, filters }: ExportButtonProps) {
  const handleExport = () => {
    // Create a cleaner version of the data for export
    const exportData = filteredAccounts.map(account => ({
      "Opportunity ID": account.opptyId,
      "Client": account.client,
      "Project": account.project,
      "Vertical": account.vertical,
      "Geo": account.geo,
      "Start Month": account.startMonth,
      "Probability": `${account.probability}%`,
      "Opportunity Status": account.opportunityStatus,
      "SOW Status": account.sowStatus,
      "Project Status": account.projectStatus,
      "Client Partner": account.clientPartner,
      "Proposal Anchor": account.proposalAnchor,
      "Delivery Partner": account.deliveryPartner,
      "Added By": account.addedBy,
      "Added On": account.addedOn,
      "Last Updated By": account.lastUpdatedBy,
      "Updated On": account.updatedOn,
      "Comment": account.comment
    }));
    
    // Generate filename based on filters
    let filename = "accounts";
    if (Object.keys(filters).some(key => filters[key as keyof AccountFilters]?.length)) {
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
