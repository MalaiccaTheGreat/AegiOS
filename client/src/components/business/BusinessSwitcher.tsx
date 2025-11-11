import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, Loader2, Check, Building2 } from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function BusinessSwitcher() {
  const { 
    currentBusiness, 
    businesses, 
    isLoading,
    switchBusiness, 
    refreshBusinesses 
  } = useBusiness();
  const [location, navigate] = useLocation();
  const [isSwitching, setIsSwitching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSwitchBusiness = async (businessId: number) => {
    try {
      setIsSwitching(true);
      await switchBusiness(businessId);
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to switch business:", error);
      toast.error("Failed to switch business");
    } finally {
      setIsSwitching(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshBusinesses();
      toast.success("Businesses updated");
    } catch (error) {
      console.error("Failed to refresh businesses:", error);
      toast.error("Failed to refresh businesses");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading && businesses.length === 0) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (!currentBusiness) {
    return (
      <Button 
        variant="outline" 
        onClick={() => navigate("/business/new")}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Create Business
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 min-w-[200px] justify-between"
          disabled={isSwitching}
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-col items-start truncate">
              <span className="font-medium truncate max-w-[120px]">
                {currentBusiness.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {businesses.length} business{businesses.length !== 1 ? "es" : ""}
              </span>
            </div>
          </div>
          {isSwitching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Your Businesses</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span className="text-xs">↻</span>
            )}
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {businesses.map((business) => (
            <DropdownMenuItem
              key={business.id}
              onClick={() => handleSwitchBusiness(business.id)}
              className={cn(
                "flex items-center justify-between",
                currentBusiness.id === business.id && "bg-accent"
              )}
              disabled={isSwitching}
            >
              <span className="truncate">{business.name}</span>
              {currentBusiness.id === business.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            navigate("/business/new");
          }}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Business
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
