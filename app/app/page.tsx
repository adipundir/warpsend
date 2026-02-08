"use client";

import { useState } from "react";
import { UnifiedBalance } from "@/components/unified-balance";
import { SendFlow } from "@/components/send-flow";
import { ReceiveFlow } from "@/components/receive-flow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AppPage() {
  const [activeTab, setActiveTab] = useState("send");

  return (
    <div className="flex flex-col items-center py-8 px-4 max-w-6xl mx-auto">
      <div className="w-full mb-8">
        <UnifiedBalance />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-2xl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">Send</TabsTrigger>
          <TabsTrigger value="receive">Receive</TabsTrigger>
        </TabsList>
        
        <TabsContent value="send" className="mt-6">
          <SendFlow />
        </TabsContent>
        
        <TabsContent value="receive" className="mt-6">
          <ReceiveFlow />
        </TabsContent>
      </Tabs>
    </div>
  );
}
