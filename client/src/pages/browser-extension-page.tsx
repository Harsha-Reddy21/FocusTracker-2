import { ArrowDownToLine, HelpCircle, Shield, Lock, Globe, Zap, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

import { Layout } from "@/components/layout";

export default function BrowserExtensionPage() {
  // Download handler
  const handleDownload = () => {
    window.location.href = '/api/extension/download';
  };
  
  return (
    <Layout>
      <div className="container max-w-5xl py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">FocusFlow Browser Extension</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          The most effective way to block distracting websites during your focus sessions
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <div className="inline-flex rounded-lg bg-muted px-3 py-1 text-sm">
            <Shield className="mr-2 h-4 w-4 text-primary" /> True website blocking
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            Supercharge your focus with our browser extension
          </h2>
          <p className="text-muted-foreground">
            Due to browser security restrictions, web applications cannot directly control or block access to other websites. For robust website blocking, a browser extension is required.
          </p>
          
          <ul className="space-y-2">
            {[
              "Complete blocking of distracting websites",
              "Works across all browser tabs",
              "Syncs with your FocusFlow account",
              "Elegant block page with session timer",
              "Fast and lightweight (less than 100KB)"
            ].map((feature, i) => (
              <li key={i} className="flex items-start">
                <div className="mr-2 mt-1 h-4 w-4 shrink-0 rounded-full bg-primary-foreground flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          
          <div className="pt-4">
            <Button size="lg" onClick={handleDownload} className="group">
              <ArrowDownToLine className="mr-2 h-4 w-4 transition-transform group-hover:-translate-y-1" />
              Download Extension
            </Button>
          </div>
        </div>
        
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Browser Extension</span>
              </CardTitle>
              <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                Recommended
              </div>
            </div>
            <CardDescription>
              True website blocking with browser-level protection
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Zap className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">True Website Blocking</h3>
                <p className="text-sm text-muted-foreground">Completely prevents access to distracting sites</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Globe className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Browser-level Integration</h3>
                <p className="text-sm text-muted-foreground">Works across all tabs in your browser</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <h3 className="font-medium">Syncs with FocusFlow</h3>
                <p className="text-sm text-muted-foreground">Automatically gets your blocklist and sessions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Lock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium">Privacy First</h3>
                <p className="text-sm text-muted-foreground">All blocking happens locally on your device</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/30 flex flex-col items-stretch gap-4 pt-6">
            <Button variant="default" onClick={handleDownload} className="w-full">
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Download Extension
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Works with Chrome, Firefox, Edge, and Brave
            </p>
          </CardFooter>
        </Card>
      </div>
      
      <Tabs defaultValue="install" className="w-full max-w-3xl mx-auto">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="install">Installation</TabsTrigger>
          <TabsTrigger value="usage">How to Use</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>
        
        <TabsContent value="install" className="p-6 border rounded-lg mt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Installation for Chrome / Edge / Brave</h3>
              <ol className="space-y-2 list-decimal pl-5">
                <li>Download the extension using the button above</li>
                <li>Unzip the downloaded file to a folder on your computer</li>
                <li>Open your browser and navigate to <code className="bg-muted px-1 rounded">chrome://extensions/</code></li>
                <li>Enable "Developer mode" using the toggle in the top-right corner</li>
                <li>Click "Load unpacked" and select the extension folder</li>
                <li>The FocusFlow extension icon should appear in your toolbar</li>
              </ol>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Installation for Firefox</h3>
              <ol className="space-y-2 list-decimal pl-5">
                <li>Download the extension using the button above</li>
                <li>Unzip the downloaded file to a folder on your computer</li>
                <li>Open Firefox and navigate to <code className="bg-muted px-1 rounded">about:debugging#/runtime/this-firefox</code></li>
                <li>Click "Load Temporary Add-on"</li>
                <li>Navigate to the extension folder and select the manifest.json file</li>
                <li>The FocusFlow extension icon should appear in your toolbar</li>
              </ol>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="usage" className="p-6 border rounded-lg mt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Using the Extension</h3>
              <ol className="space-y-2 list-decimal pl-5">
                <li>Click the FocusFlow icon in your browser toolbar</li>
                <li>Start a focus session using the "Start Focus Session" button</li>
                <li>The extension will block any attempts to visit sites on your blocklist</li>
                <li>When you try to visit a blocked site, you'll see a friendly reminder page</li>
                <li>You can end your session early using the "End Focus Session" button</li>
              </ol>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Connecting to Your FocusFlow Account</h3>
              <ol className="space-y-2 list-decimal pl-5">
                <li>Log in to your FocusFlow account in the web app</li>
                <li>Go to the Settings page</li>
                <li>In the "Browser Extension" section, click "Connect Extension"</li>
                <li>Your blocklist and session data will now sync between the app and extension</li>
              </ol>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="faq" className="p-6 border rounded-lg mt-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="q1">
              <AccordionTrigger>
                Why do I need a browser extension instead of just using the web app?
              </AccordionTrigger>
              <AccordionContent>
                Browser security restrictions prevent web applications from controlling navigation to other websites. This is intentional and protects your privacy. A browser extension has the necessary permissions to truly block distracting websites, while a web app can only provide reminders and nudges.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="q2">
              <AccordionTrigger>
                Is the extension safe to use?
              </AccordionTrigger>
              <AccordionContent>
                Yes, the FocusFlow extension is completely safe. It's open-source, so you can review the code yourself if you wish. The extension only monitors URLs to check if they match your blocklist, and no browsing data is collected or sent to external servers except when syncing with your FocusFlow account.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="q3">
              <AccordionTrigger>
                Will the extension slow down my browser?
              </AccordionTrigger>
              <AccordionContent>
                No, the FocusFlow extension is very lightweight and has minimal impact on browser performance. It only activates when you're in an active focus session, and even then, it uses efficient matching algorithms that don't impact browsing speed.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="q4">
              <AccordionTrigger>
                Can I customize which sites are blocked?
              </AccordionTrigger>
              <AccordionContent>
                Yes, you can manage your blocklist through the FocusFlow web app. Go to the Blocklist page, add or remove sites as needed, and the extension will automatically sync with your changes.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="q5">
              <AccordionTrigger>
                What if I need to access a blocked site during a focus session?
              </AccordionTrigger>
              <AccordionContent>
                If you absolutely need to access a blocked site, you have two options: (1) end your focus session early, which will remove all site restrictions, or (2) click the "Allow access for 5 minutes" button on the block page, which will temporarily allow access to that specific site.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>
      
      <div className="bg-muted/40 rounded-lg p-6 border border-muted">
        <div className="flex items-start gap-4">
          <div className="mt-1">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium mb-2">Why a browser extension?</h3>
            <p className="text-muted-foreground text-sm">
              Modern browsers have strict security policies that prevent one website from controlling or monitoring other websites or tabs. This is an intentional security feature to protect your privacy online. Because of these restrictions, a web application (like FocusFlow) cannot directly block access to other websites. A browser extension has additional permissions that allow it to monitor and control navigation across all tabs, making it the most effective solution for website blocking.
            </p>
          </div>
        </div>
      </div>
    </div>
    </Layout>
  );
}