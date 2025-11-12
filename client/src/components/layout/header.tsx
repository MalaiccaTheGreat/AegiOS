import { Bell, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import EmailModal from "@/components/modals/email-modal";
import { Logo } from "@/components/ui/logo";
import { MobileMenu } from "./sidebar";

export default function Header() {
  const [showEmailModal, setShowEmailModal] = useState(false);

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center">
              <div className="md:hidden mr-2">
                <MobileMenu />
              </div>
              <Logo
                withText={true}
                size="lg"
                className="hover:opacity-90 transition-opacity"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-lg hover:bg-gray-100 relative"
                title="Notifications"
              >
                <Bell className="text-gray-600" size={20} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full"></span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setShowEmailModal(true)}
                title="Messages"
              >
                <Mail className="text-gray-600" size={20} />
              </Button>

              <div className="hidden md:flex items-center space-x-3 ml-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  AD
                </div>
                <span className="text-sm font-medium text-gray-700 hidden lg:inline-block">Admin User</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />
    </>
  );
}
