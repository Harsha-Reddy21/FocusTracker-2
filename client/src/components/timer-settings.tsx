import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TimerSetting } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function TimerSettings() {
  const { toast } = useToast();
  
  // Fetch timer settings
  const { data: settings, isLoading } = useQuery<TimerSetting>({
    queryKey: ["/api/timer-settings"],
  });
  
  // Create state for form values
  const [formValues, setFormValues] = useState<Partial<TimerSetting>>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    soundEnabled: true,
    notificationsEnabled: true,
    soundVolume: 75,
    soundType: "bell",
  });
  
  // Update form values when settings are loaded
  useState(() => {
    if (settings) {
      setFormValues({
        workDuration: settings.workDuration,
        shortBreakDuration: settings.shortBreakDuration,
        longBreakDuration: settings.longBreakDuration,
        longBreakInterval: settings.longBreakInterval,
        soundEnabled: settings.soundEnabled,
        notificationsEnabled: settings.notificationsEnabled,
        soundVolume: settings.soundVolume,
        soundType: settings.soundType,
      });
    }
  });
  
  // Update timer settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<TimerSetting>) => {
      const res = await apiRequest("PUT", "/api/timer-settings", data);
      return await res.json();
    },
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(["/api/timer-settings"], updatedSettings);
      toast({
        title: "Settings updated",
        description: "Your timer settings have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle input changes
  const handleChange = (field: keyof typeof formValues, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  
  // Handle number input changes (with validation)
  const handleNumberChange = (field: keyof typeof formValues, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      handleChange(field, numValue);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formValues);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <Skeleton className="h-5 w-32 mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Skeleton className="h-5 w-32 mb-3" />
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-32" />
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Timer Intervals</CardTitle>
          <CardDescription>
            Customize your Pomodoro timer settings to match your work style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h4 className="text-sm font-medium mb-4">Timer Intervals</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="work-duration">Work Session Length</Label>
                <div className="flex items-center mt-1.5">
                  <Input
                    id="work-duration"
                    type="number"
                    min={1}
                    max={120}
                    value={formValues.workDuration}
                    onChange={(e) => handleNumberChange("workDuration", e.target.value)}
                    className="w-20"
                  />
                  <span className="ml-2 text-sm text-muted-foreground">minutes</span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="short-break">Short Break Length</Label>
                <div className="flex items-center mt-1.5">
                  <Input
                    id="short-break"
                    type="number"
                    min={1}
                    max={30}
                    value={formValues.shortBreakDuration}
                    onChange={(e) => handleNumberChange("shortBreakDuration", e.target.value)}
                    className="w-20"
                  />
                  <span className="ml-2 text-sm text-muted-foreground">minutes</span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="long-break">Long Break Length</Label>
                <div className="flex items-center mt-1.5">
                  <Input
                    id="long-break"
                    type="number"
                    min={5}
                    max={60}
                    value={formValues.longBreakDuration}
                    onChange={(e) => handleNumberChange("longBreakDuration", e.target.value)}
                    className="w-20"
                  />
                  <span className="ml-2 text-sm text-muted-foreground">minutes</span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="long-break-interval">Long Break After</Label>
                <div className="flex items-center mt-1.5">
                  <Input
                    id="long-break-interval"
                    type="number"
                    min={1}
                    max={12}
                    value={formValues.longBreakInterval}
                    onChange={(e) => handleNumberChange("longBreakInterval", e.target.value)}
                    className="w-20"
                  />
                  <span className="ml-2 text-sm text-muted-foreground">pomodoros</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-4">Audio Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="alert-volume" className="mb-2 block">
                    Alert Volume ({formValues.soundVolume}%)
                  </Label>
                  <Slider
                    id="alert-volume"
                    min={0}
                    max={100}
                    step={1}
                    value={[formValues.soundVolume || 75]}
                    onValueChange={(values) => handleChange("soundVolume", values[0])}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="alert-sound" className="mb-2 block">Alert Sound</Label>
                <Select
                  value={formValues.soundType}
                  onValueChange={(value) => handleChange("soundType", value)}
                >
                  <SelectTrigger id="alert-sound">
                    <SelectValue placeholder="Select a sound" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bell">Bell</SelectItem>
                    <SelectItem value="chime">Chime</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="soft">Soft Tone</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="border-t px-6 py-4">
          <Button 
            type="submit"
            disabled={updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
