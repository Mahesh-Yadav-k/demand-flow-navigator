
import { useAuth } from "@/contexts/AuthContext";
import { Account } from "@/types";
import { Eye, Edit, Trash } from "lucide-react";
import { ActionMenuItem } from "@/types";

export const useAccountOptions = (
  handleViewAccount: (account: Account) => void,
  handleEditAccount: (account: Account) => void,
  handleDeleteAccount: (account: Account) => void,
) => {
  const { hasPermission } = useAuth();
  
  const accountOptions: ActionMenuItem<Account>[] = [
    {
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: handleViewAccount,
    },
    {
      label: "Edit Account",
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditAccount,
      showIf: () => hasPermission('canEditAccounts'),
      disabled: !hasPermission('canEditAccounts'),
    },
    {
      label: "Delete Account",
      icon: <Trash className="h-4 w-4" />,
      onClick: handleDeleteAccount,
      showIf: () => hasPermission('canDeleteAccounts'),
      disabled: !hasPermission('canDeleteAccounts'),
    },
  ];
  
  return accountOptions;
};
