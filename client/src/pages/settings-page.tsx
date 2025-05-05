import { Layout } from "@/components/layout";
import { TimerSettings } from "@/components/timer-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bell, Moon, Sun, Laptop } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string>("timer");
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState({
    desktop: true,
    sound: true,
    breakReminders: true
  });

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));

    if (key === 'desktop' && value) {
      // Request notification permission
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }

    toast({
      title: "Settings updated",
      description: "Your notification settings have been saved."
    });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Settings</h2>
          <p className="text-muted-foreground">Customize your FocusFlow experience</p>
        </div>

        <div className="mb-6 border-b">
          <Tabs defaultValue="timer" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-0 bg-transparent border-b-0">
              <TabsTrigger value="timer" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                Timer Settings
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                Notifications
              </TabsTrigger>
              <TabsTrigger value="appearance" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                Appearance
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div>
          {activeTab === "timer" && <TimerSettings />}
          
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure when and how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Desktop Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show popup notifications when timer ends
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.desktop}
                      onCheckedChange={(checked) => handleNotificationChange('desktop', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Sound Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Play sounds when timer ends
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.sound}
                      onCheckedChange={(checked) => handleNotificationChange('sound', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Break Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when breaks are over
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.breakReminders}
                      onCheckedChange={(checked) => handleNotificationChange('breakReminders', checked)}
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-3">Test Notifications</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (notifications.sound) {
                        const audio = new Audio("/timer-completed.mp3");
                        audio.volume = 0.75;
                        audio.play().catch(e => console.error("Error playing sound:", e));
                      }
                      
                      if (notifications.desktop && Notification.permission === "granted") {
                        new Notification("FocusFlow Test", {
                          body: "Notifications are working correctly!"
                        });
                      } else if (notifications.desktop) {
                        toast({
                          title: "Permission required",
                          description: "Please enable notifications in your browser settings.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Test Notification
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of FocusFlow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Theme</h3>
                    <RadioGroup 
                      defaultValue={theme} 
                      onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
                      className="grid grid-cols-3 gap-4"
                    >
                      <div>
                        <RadioGroupItem 
                          value="light" 
                          id="theme-light" 
                          className="sr-only" 
                        />
                        <Label
                          htmlFor="theme-light"
                          className={`flex flex-col items-center justify-between rounded-md border-2 ${
                            theme === "light" ? "border-primary" : "border-muted"
                          } p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer`}
                        >
                          <Sun className="mb-3 h-6 w-6" />
                          <span className="text-sm font-medium">Light</span>
                        </Label>
                      </div>
                      
                      <div>
                        <RadioGroupItem 
                          value="dark" 
                          id="theme-dark" 
                          className="sr-only" 
                        />
                        <Label
                          htmlFor="theme-dark"
                          className={`flex flex-col items-center justify-between rounded-md border-2 ${
                            theme === "dark" ? "border-primary" : "border-muted"
                          } p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer`}
                        >
                          <Moon className="mb-3 h-6 w-6" />
                          <span className="text-sm font-medium">Dark</span>
                        </Label>
                      </div>
                      
                      <div>
                        <RadioGroupItem 
                          value="system" 
                          id="theme-system" 
                          className="sr-only" 
                        />
                        <Label
                          htmlFor="theme-system"
                          className={`flex flex-col items-center justify-between rounded-md border-2 ${
                            theme === "system" ? "border-primary" : "border-muted"
                          } p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer`}
                        >
                          <Laptop className="mb-3 h-6 w-6" />
                          <span className="text-sm font-medium">System</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
